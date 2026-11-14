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
public class LocalUserAirlineController : ControllerBase
{
    private readonly LocalUserAirlineBL _bl;
    private readonly TokenUtil _tokenUtil;
    public LocalUserAirlineController(IConfiguration config)
    {
        _bl = new LocalUserAirlineBL(config.GetValue<string>("connectionString") ?? "");
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
    [HttpGet("GetById/{localUserId}/{airlineId}")]
    public async Task<IActionResult> GetById(Guid localUserId, Guid airlineId)
    {
        try
        {
            return Ok(await _bl.GetById(localUserId, airlineId));
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
    public async Task<IActionResult> Add([FromBody] LocalUserAirline entity)
    {
        try
        {
            return Ok(await _bl.Add(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] LocalUserAirline entity)
    {
        try
        {
            return Ok(await _bl.Update(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpDelete("Delete/{localUserId}/{airlineId}")]
    public async Task<IActionResult> Delete(Guid localUserId, Guid airlineId)
    {
        try
        {
            await _bl.Delete(localUserId, airlineId, _tokenUtil.GetUserIdFromToken(Request));
            return Ok();
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
