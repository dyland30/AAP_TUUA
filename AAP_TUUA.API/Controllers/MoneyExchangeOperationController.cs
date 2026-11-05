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
public class MoneyExchangeOperationController : ControllerBase
{
    private readonly MoneyExchangeOperationBL _moneyExchangeOperationBl;
    private readonly TokenUtil _tokenUtil;

    public MoneyExchangeOperationController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _moneyExchangeOperationBl = new MoneyExchangeOperationBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _moneyExchangeOperationBl.GetAll());
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
            return Ok(await _moneyExchangeOperationBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByCashierMachineSessionId/{cashierMachineSessionId}")]
    public async Task<IActionResult> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        try
        {
            return Ok(await _moneyExchangeOperationBl.GetByCashierMachineSessionId(cashierMachineSessionId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByExchangeRateId/{exchangeRateId}")]
    public async Task<IActionResult> GetByExchangeRateId(Guid exchangeRateId)
    {
        try
        {
            return Ok(await _moneyExchangeOperationBl.GetByExchangeRateId(exchangeRateId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] MoneyExchangeOperation moneyExchangeOperation)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _moneyExchangeOperationBl.Add(moneyExchangeOperation, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] MoneyExchangeOperation moneyExchangeOperation)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _moneyExchangeOperationBl.Update(moneyExchangeOperation, userId));
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
            await _moneyExchangeOperationBl.Delete(id);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
