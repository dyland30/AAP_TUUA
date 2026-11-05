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
public class LocalUserCashierMachineController : ControllerBase
{
    private readonly LocalUserCashierMachineBL _localUserCashierMachineBl;
    private readonly TokenUtil _tokenUtil;

    public LocalUserCashierMachineController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _localUserCashierMachineBl = new LocalUserCashierMachineBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _localUserCashierMachineBl.GetAll());
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
            return Ok(await _localUserCashierMachineBl.GetByLocalUserId(localUserId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByCashierMachineCode/{cashierMachineCode}")]
    public async Task<IActionResult> GetByCashierMachineCode(string cashierMachineCode)
    {
        try
        {
            return Ok(await _localUserCashierMachineBl.GetByCashierMachineCode(cashierMachineCode));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] LocalUserCashierMachine assignment)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _localUserCashierMachineBl.Add(assignment, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{localUserId}/{cashierMachineCode}")]
    public async Task<IActionResult> Delete(Guid localUserId, string cashierMachineCode)
    {
        try
        {
            await _localUserCashierMachineBl.Delete(localUserId, cashierMachineCode);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
