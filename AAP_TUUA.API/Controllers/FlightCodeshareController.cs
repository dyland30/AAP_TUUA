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
public class FlightCodeshareController : ControllerBase
{
    private readonly FlightCodeshareBL _flightCodeshareBl;
    private readonly TokenUtil _tokenUtil;

    public FlightCodeshareController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _flightCodeshareBl = new FlightCodeshareBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _flightCodeshareBl.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetById/{flightId}/{airlineId}/{flightIdentity}")]
    public async Task<IActionResult> GetById(Guid flightId, Guid airlineId, string flightIdentity)
    {
        try
        {
            return Ok(await _flightCodeshareBl.GetById(flightId, airlineId, flightIdentity));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByFlightId/{flightId}")]
    public async Task<IActionResult> GetByFlightId(Guid flightId)
    {
        try
        {
            return Ok(await _flightCodeshareBl.GetByFlightId(flightId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByAirlineId/{airlineId}")]
    public async Task<IActionResult> GetByAirlineId(Guid airlineId)
    {
        try
        {
            return Ok(await _flightCodeshareBl.GetByAirlineId(airlineId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] FlightCodeshare codeshare)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _flightCodeshareBl.Add(codeshare, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{flightId}/{airlineId}/{flightIdentity}")]
    public async Task<IActionResult> Delete(Guid flightId, Guid airlineId, string flightIdentity)
    {
        try
        {
            await _flightCodeshareBl.Delete(flightId, airlineId, flightIdentity);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
