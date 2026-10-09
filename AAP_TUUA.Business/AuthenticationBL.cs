using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AAP_TUUA.Business.Dto;
using AAP_TUUA.Business.Util;
using AAP_TUUA.Dao;
using Microsoft.IdentityModel.Tokens;

namespace AAP_TUUA.Business;

public class AuthenticationBL
{
    private readonly LocalUserDao _localUserDao;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;

    public AuthenticationBL(string cnx, string secretKey, string issuer, string audience)
    {
        _localUserDao = new LocalUserDao(cnx);
        _secretKey = secretKey;
        _issuer = issuer;
        _audience = audience;
    }

    public async Task<AuthenticationResult?> Authenticate(UserDto? user)
    {
        if (user is null) return null;

        if (string.IsNullOrEmpty(user.email) || string.IsNullOrEmpty(user.password)) return null;

        var userDb = await _localUserDao.GetLocalUserByUsername(user.email);
        if (userDb is null) return null;

        var salt = Convert.FromBase64String(userDb.password_salt!);
        if (!Security.VerifyPassword(user.password, userDb.password_hash!, salt)) return null;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, userDb.id.ToString() ?? string.Empty),
            new(ClaimTypes.Email, userDb.email ?? string.Empty)
        };
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = credentials,
            Issuer = _issuer,
            Audience = _audience
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return new AuthenticationResult
        {
            user_id = userDb.id,
            email = userDb.email,
            token = tokenHandler.WriteToken(token),
            expires_in = 8 * 60 * 60,
            token_type = "bearer"
        };
    }
}
