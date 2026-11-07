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
public class CashierMachineSessionClosingController : ControllerBase
{
    private readonly CashierMachineSessionClosingBL _closingBl;
    private readonly TokenUtil _tokenUtil;

    public CashierMachineSessionClosingController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _closingBl = new CashierMachineSessionClosingBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetBalance")]
    public async Task<IActionResult> GetBalance()
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _closingBl.GetBalance(userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetBySessionId/{cashierMachineSessionId}")]
    public async Task<IActionResult> GetBySessionId(Guid cashierMachineSessionId)
    {
        try
        {
            return Ok(await _closingBl.GetBySessionId(cashierMachineSessionId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Close")]
    public async Task<IActionResult> Close([FromBody] CashierMachineSessionCloseRequest request)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _closingBl.Close(request, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
