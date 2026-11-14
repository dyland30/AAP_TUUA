using System.Net;
using AAP_TUUA.API.Filters;
using AAP_TUUA.Business;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AuthFilter]
public class FlightStatusHistoryController : ControllerBase
{
    private readonly FlightStatusHistoryBL _bl;
    public FlightStatusHistoryController(IConfiguration config)
    {
        _bl = new FlightStatusHistoryBL(config.GetValue<string>("connectionString") ?? "");
    }
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _bl.GetAll());
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetById/{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            return Ok(await _bl.GetById(id));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetByFlightId/{flightId}")]
    public async Task<IActionResult> GetByFlightId(Guid flightId)
    {
        try
        {
            return Ok(await _bl.GetByFlightId(flightId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
