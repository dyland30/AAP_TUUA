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
public class StandController : ControllerBase
{
    private readonly StandBL _standBL;
    private readonly TokenUtil _tokenUtil;

    public StandController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _standBL = new StandBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _standBL.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetById/{resourceId}")]
    public async Task<IActionResult> GetById(Guid resourceId)
    {
        try
        {
            return Ok(await _standBL.GetById(resourceId));
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
            return Ok(await _standBL.GetByTerminalId(terminalId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] Stand stand)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _standBL.Add(stand, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] Stand stand)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _standBL.Update(stand, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{resourceId}")]
    public async Task<IActionResult> Delete(Guid resourceId)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _standBL.Delete(resourceId, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
