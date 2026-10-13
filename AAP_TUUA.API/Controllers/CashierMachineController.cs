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
public class CashierMachineController : ControllerBase
{
    private readonly CashierMachineBL _cashierMachineBl;
    private readonly TokenUtil _tokenUtil;

    public CashierMachineController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _cashierMachineBl = new CashierMachineBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _cashierMachineBl.GetAll());
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
            return Ok(await _cashierMachineBl.GetByCode(code));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] CashierMachine cashierMachine)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _cashierMachineBl.Add(cashierMachine, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] CashierMachine cashierMachine)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _cashierMachineBl.Update(cashierMachine, userId));
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
            await _cashierMachineBl.Delete(code, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
