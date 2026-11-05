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
public class CashFlowController : ControllerBase
{
    private readonly CashFlowBL _cashFlowBl;
    private readonly TokenUtil _tokenUtil;

    public CashFlowController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _cashFlowBl = new CashFlowBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _cashFlowBl.GetAll());
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
            return Ok(await _cashFlowBl.GetById(id));
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
            return Ok(await _cashFlowBl.GetByCashierMachineSessionId(cashierMachineSessionId));
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
            return Ok(await _cashFlowBl.GetBySalesOperationId(tuuaSalesOperationId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByMoneyExchangeOperationId/{moneyExchangeOperationId}")]
    public async Task<IActionResult> GetByMoneyExchangeOperationId(Guid moneyExchangeOperationId)
    {
        try
        {
            return Ok(await _cashFlowBl.GetByMoneyExchangeOperationId(moneyExchangeOperationId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] CashFlow cashFlow)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _cashFlowBl.Add(cashFlow, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] CashFlow cashFlow)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _cashFlowBl.Update(cashFlow, userId));
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
            await _cashFlowBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
