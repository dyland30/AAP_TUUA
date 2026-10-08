using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AAP_TUUA.API.Util;

public class TokenUtil
{
    private readonly IConfiguration _config;
    public TokenUtil(IConfiguration config)
    {
        _config = config;
        
    }
    //get Token from header
    public string? GetUserIdFromToken(HttpRequest request)
    {
        var authorizationHeader = request.Headers["Authorization"];
        if (authorizationHeader.Count == 0)
        {
            return string.Empty;
        }
        var token = authorizationHeader.ToString().Split(' ')[1];
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config.GetValue<string>("secretKey")??"")),
            ValidateIssuer = true,
            ValidIssuer = _config["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = _config["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero // Consider setting a small clock skew for tolerance
        };

        tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
        var jwtToken = (JwtSecurityToken)validatedToken;
        string userId = jwtToken.Claims.FirstOrDefault(c => c.Type == "unique_name")?.Value ?? string.Empty;
        return userId;
    }
}