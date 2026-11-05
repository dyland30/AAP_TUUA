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
public class ExchangeRateController : ControllerBase
{
    private readonly ExchangeRateBL _exchangeRateBl;
    private readonly TokenUtil _tokenUtil;

    public ExchangeRateController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _exchangeRateBl = new ExchangeRateBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _exchangeRateBl.GetAll());
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
            return Ok(await _exchangeRateBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByCurrencies")]
    public async Task<IActionResult> GetByCurrencies([FromQuery] int baseCurrencyId, [FromQuery] int targetCurrencyId)
    {
        try
        {
            return Ok(await _exchangeRateBl.GetByCurrencies(baseCurrencyId, targetCurrencyId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByDayAndCurrencies")]
    public async Task<IActionResult> GetByDayAndCurrencies([FromQuery] DateTime day,
        [FromQuery] int baseCurrencyId, [FromQuery] int targetCurrencyId)
    {
        try
        {
            return Ok(await _exchangeRateBl.GetByDayAndCurrencies(day, baseCurrencyId, targetCurrencyId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] ExchangeRate exchangeRate)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _exchangeRateBl.Add(exchangeRate, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] ExchangeRate exchangeRate)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _exchangeRateBl.Update(exchangeRate, userId));
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
            await _exchangeRateBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
