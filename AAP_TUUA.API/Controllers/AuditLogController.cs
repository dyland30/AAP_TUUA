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
public class AuditLogController : ControllerBase
{
    private readonly AuditLogBL _bl;
    private readonly TokenUtil _tokenUtil;
    public AuditLogController(IConfiguration config)
    {
        _bl = new AuditLogBL(config.GetValue<string>("connectionString") ?? "");
        _tokenUtil = new TokenUtil(config);
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
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            return Ok(await _bl.GetById(id));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetByAirportId/{airportId}")]
    public async Task<IActionResult> GetByAirportId(Guid airportId)
    {
        try
        {
            return Ok(await _bl.GetByAirportId(airportId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] AuditLog entity)
    {
        try
        {
            return Ok(await _bl.Add(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
