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
public class AirportResourceAllocationController : ControllerBase
{
    private readonly AirportResourceAllocationBL _allocationBl;
    private readonly TokenUtil _tokenUtil;

    public AirportResourceAllocationController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _allocationBl = new AirportResourceAllocationBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _allocationBl.GetAll());
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
            return Ok(await _allocationBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByAirportResourceId/{airportResourceId}")]
    public async Task<IActionResult> GetByAirportResourceId(Guid airportResourceId)
    {
        try
        {
            return Ok(await _allocationBl.GetByAirportResourceId(airportResourceId));
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
            return Ok(await _allocationBl.GetByFlightId(flightId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByTurnaroundId/{turnaroundId}")]
    public async Task<IActionResult> GetByTurnaroundId(Guid turnaroundId)
    {
        try
        {
            return Ok(await _allocationBl.GetByTurnaroundId(turnaroundId));
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
            return Ok(await _allocationBl.GetByAirlineId(airlineId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetActiveByAirportResourceId")]
    public async Task<IActionResult> GetActiveByAirportResourceId([FromQuery] Guid airportResourceId, [FromQuery] DateTime date)
    {
        try
        {
            return Ok(await _allocationBl.GetActiveByAirportResourceId(airportResourceId, date));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] AirportResourceAllocation allocation)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _allocationBl.Add(allocation, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] AirportResourceAllocation allocation)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _allocationBl.Update(allocation, userId));
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
            await _allocationBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
