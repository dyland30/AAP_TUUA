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
public class CheckinCounterController : ControllerBase
{
    private readonly CheckinCounterBL _checkinCounterBl;
    private readonly TokenUtil _tokenUtil;

    public CheckinCounterController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _checkinCounterBl = new CheckinCounterBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _checkinCounterBl.GetAll());
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
            return Ok(await _checkinCounterBl.GetById(resourceId));
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
            return Ok(await _checkinCounterBl.GetByTerminalId(terminalId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] CheckinCounter counter)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _checkinCounterBl.Add(counter, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] CheckinCounter counter)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _checkinCounterBl.Update(counter, userId));
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
            await _checkinCounterBl.Delete(resourceId, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
