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
public class CashierMachineSessionController : ControllerBase
{
    private readonly CashierMachineSessionBL _cashierMachineSessionBl;
    private readonly TokenUtil _tokenUtil;

    public CashierMachineSessionController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _cashierMachineSessionBl = new CashierMachineSessionBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _cashierMachineSessionBl.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetById/{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            return Ok(await _cashierMachineSessionBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetOpenByCashierMachineCode/{cashierMachineCode}")]
    public async Task<IActionResult> GetOpenByCashierMachineCode(string cashierMachineCode)
    {
        try
        {
            return Ok(await _cashierMachineSessionBl.GetOpenByCashierMachineCode(cashierMachineCode));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByLocalUserId/{localUserId}")]
    public async Task<IActionResult> GetByLocalUserId(Guid localUserId)
    {
        try
        {
            return Ok(await _cashierMachineSessionBl.GetByLocalUserId(localUserId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] CashierMachineSession session)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _cashierMachineSessionBl.Add(session, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] CashierMachineSession session)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _cashierMachineSessionBl.Update(session, userId));
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
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _cashierMachineSessionBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
