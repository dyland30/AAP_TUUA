using System.Net;
using AAP_TUUA.API.Filters;
using AAP_TUUA.API.Util;
using AAP_TUUA.Business;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AuthFilter]
public class TuuaGateController : ControllerBase
{
    private readonly TuuaGateBL _tuuaGateBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaGateController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaGateBl = new TuuaGateBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _tuuaGateBl.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByCode/{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        try
        {
            return Ok(await _tuuaGateBl.GetByCode(code));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByTerminalId/{terminalId}")]
    public async Task<IActionResult> GetByTerminalId(Guid terminalId)
    {
        try
        {
            return Ok(await _tuuaGateBl.GetByTerminalId(terminalId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] TuuaGate tuuaGate)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaGateBl.Add(tuuaGate, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] TuuaGate tuuaGate)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaGateBl.Update(tuuaGate, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{code}")]
    public async Task<IActionResult> Delete(string code)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _tuuaGateBl.Delete(code, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
