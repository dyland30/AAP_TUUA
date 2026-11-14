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
public class FlightStatusTransitionController : ControllerBase
{
    private readonly FlightStatusTransitionBL _bl;
    private readonly TokenUtil _tokenUtil;
    public FlightStatusTransitionController(IConfiguration config)
    {
        _bl = new FlightStatusTransitionBL(config.GetValue<string>("connectionString") ?? "");
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
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            return Ok(await _bl.GetById(id));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetByFromStatusId/{fromStatusId}")]
    public async Task<IActionResult> GetByFromStatusId(int fromStatusId)
    {
        try
        {
            return Ok(await _bl.GetByFromStatusId(fromStatusId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] FlightStatusTransition entity)
    {
        try
        {
            return Ok(await _bl.Add(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] FlightStatusTransition entity)
    {
        try
        {
            return Ok(await _bl.Update(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpDelete("Delete/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _bl.Delete(id, _tokenUtil.GetUserIdFromToken(Request));
            return Ok();
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
