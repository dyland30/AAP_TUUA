using System.Net;
using AAP_TUUA.Business;
using AAP_TUUA.Business.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
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
}
