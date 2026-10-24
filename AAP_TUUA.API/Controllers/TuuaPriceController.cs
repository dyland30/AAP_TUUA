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
public class TuuaPriceController : ControllerBase
{
    private readonly TuuaPriceBL _tuuaPriceBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaPriceController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaPriceBl = new TuuaPriceBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _tuuaPriceBl.GetAll());
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
            return Ok(await _tuuaPriceBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByLocationAndTerminal/{locationId}/{terminalId}")]
    public async Task<IActionResult> GetByLocationAndTerminal(Guid locationId, Guid terminalId)
    {
        try
        {
            return Ok(await _tuuaPriceBl.GetByLocationAndTerminal(locationId, terminalId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetActivePrice")]
    public async Task<IActionResult> GetActivePrice([FromQuery] int flightTypeId, [FromQuery] Guid locationId,
        [FromQuery] Guid terminalId, [FromQuery] int currencyId, [FromQuery] DateTime date)
    {
        try
        {
            return Ok(await _tuuaPriceBl.GetActivePrice(flightTypeId, locationId, terminalId, currencyId, date));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] TuuaPrice tuuaPrice)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaPriceBl.Add(tuuaPrice, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] TuuaPrice tuuaPrice)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaPriceBl.Update(tuuaPrice, userId));
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
            await _tuuaPriceBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
