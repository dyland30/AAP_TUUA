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
public class LocalUserAirportController : ControllerBase
{
    private readonly LocalUserAirportBL _bl;
    private readonly TokenUtil _tokenUtil;
    public LocalUserAirportController(IConfiguration config)
    {
        _bl = new LocalUserAirportBL(config.GetValue<string>("connectionString") ?? "");
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
    [HttpGet("GetById/{localUserId}/{airportId}")]
    public async Task<IActionResult> GetById(Guid localUserId, Guid airportId)
    {
        try
        {
            return Ok(await _bl.GetById(localUserId, airportId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetByLocalUserId/{localUserId}")]
    public async Task<IActionResult> GetByLocalUserId(Guid localUserId)
    {
        try
        {
            return Ok(await _bl.GetByLocalUserId(localUserId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] LocalUserAirport entity)
    {
        try
        {
            return Ok(await _bl.Add(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] LocalUserAirport entity)
    {
        try
        {
            return Ok(await _bl.Update(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpDelete("Delete/{localUserId}/{airportId}")]
    public async Task<IActionResult> Delete(Guid localUserId, Guid airportId)
    {
        try
        {
            await _bl.Delete(localUserId, airportId, _tokenUtil.GetUserIdFromToken(Request));
            return Ok();
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
