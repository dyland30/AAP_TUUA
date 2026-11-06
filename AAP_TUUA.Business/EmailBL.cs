using AAP_TUUA.Business.Dto;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace AAP_TUUA.Business;

public class EmailBL
{
    private readonly SmtpSettings _settings;

    public EmailBL(SmtpSettings? settings)
    {
        _settings = settings ?? new SmtpSettings();
    }

    public async Task Send(string to, string subject, string htmlBody, string? attachmentName = null,
        byte[]? attachment = null, string attachmentContentType = "application/pdf")
    {
        if (string.IsNullOrWhiteSpace(_settings.host) || string.IsNullOrWhiteSpace(_settings.from))
        {
            throw new Exception("SMTP settings are not configured");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.from_name ?? _settings.from, _settings.from));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        if (attachment is not null && attachmentName is not null)
        {
            builder.Attachments.Add(attachmentName, attachment, ContentType.Parse(attachmentContentType));
        }
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        var security = _settings.enable_ssl
            ? (_settings.port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls)
            : SecureSocketOptions.None;
        await client.ConnectAsync(_settings.host, _settings.port, security);
        if (!string.IsNullOrWhiteSpace(_settings.user))
        {
            await client.AuthenticateAsync(_settings.user, _settings.password ?? string.Empty);
        }
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
