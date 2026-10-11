using System.Net;
using AAP_TUUA.Business;
using AAP_TUUA.Business.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthenticationController : ControllerBase
{
    private readonly AuthenticationBL _authenticationBl;

    public AuthenticationController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        var secretKey = config.GetValue<string>("secretKey") ?? "";
        var issuer = config["Jwt:Issuer"] ?? "";
        var audience = config["Jwt:Audience"] ?? "";

        _authenticationBl = new AuthenticationBL(cnx, secretKey, issuer, audience);
    }

    [HttpPost("authenticate")]
    [AllowAnonymous]
    public async Task<IActionResult> Authenticate([FromBody] UserDto? user)
    {
        try
        {
            var result = await _authenticationBl.Authenticate(user);
            if (result is null)
            {
                return BadRequest("Incorrect Username or Password");
            }

            return Ok(result);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return StatusCode((int)HttpStatusCode.InternalServerError, "There was an unexpected error, please try again");
        }
    }

    // Canjea un access token de Entra ID por el JWT propio de la aplicación.
    [HttpPost("authenticate-entra")]
    [Authorize(AuthenticationSchemes = "EntraId")]
    public async Task<IActionResult> AuthenticateEntra()
    {
        try
        {
            var email = User.FindFirst("preferred_username")?.Value
                        ?? User.FindFirst("email")?.Value
                        ?? User.FindFirst("upn")?.Value;

            var result = await _authenticationBl.AuthenticateExternal(email);
            if (result is null)
            {
                return StatusCode((int)HttpStatusCode.Forbidden, "Tu cuenta corporativa no está habilitada en TUUA");
            }

            return Ok(result);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return StatusCode((int)HttpStatusCode.InternalServerError, "There was an unexpected error, please try again");
        }
    }
}
