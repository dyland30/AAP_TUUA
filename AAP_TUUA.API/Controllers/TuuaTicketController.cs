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
public class TuuaTicketController : ControllerBase
{
    private readonly TuuaTicketBL _tuuaTicketBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaTicketController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaTicketBl = new TuuaTicketBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetById/{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            return Ok(await _tuuaTicketBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetBySalesOperationId/{tuuaSalesOperationId}")]
    public async Task<IActionResult> GetBySalesOperationId(Guid tuuaSalesOperationId)
    {
        try
        {
            return Ok(await _tuuaTicketBl.GetBySalesOperationId(tuuaSalesOperationId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByDocumentSequentialNumbersId/{documentSequentialNumbersId}")]
    public async Task<IActionResult> GetByDocumentSequentialNumbersId(Guid documentSequentialNumbersId)
    {
        try
        {
            return Ok(await _tuuaTicketBl.GetByDocumentSequentialNumbersId(documentSequentialNumbersId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetBySerialAndSequentialNumber")]
    public async Task<IActionResult> GetBySerialAndSequentialNumber([FromQuery] string serial,
        [FromQuery] long sequentialNumber)
    {
        try
        {
            return Ok(await _tuuaTicketBl.GetBySerialAndSequentialNumber(serial, sequentialNumber));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] TuuaTicket ticket)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaTicketBl.Add(ticket, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] TuuaTicket ticket)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaTicketBl.Update(ticket, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _tuuaTicketBl.Delete(id);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
