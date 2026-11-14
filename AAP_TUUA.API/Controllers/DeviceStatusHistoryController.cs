using System.Net;
using AAP_TUUA.API.Filters;
using AAP_TUUA.Business;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AuthFilter]
public class DeviceStatusHistoryController : ControllerBase
{
    private readonly DeviceStatusHistoryBL _bl;
    public DeviceStatusHistoryController(IConfiguration config)
    {
        _bl = new DeviceStatusHistoryBL(config.GetValue<string>("connectionString") ?? "");
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
    [HttpGet("GetByDeviceId/{deviceId}")]
    public async Task<IActionResult> GetByDeviceId(Guid deviceId)
    {
        try
        {
            return Ok(await _bl.GetByDeviceId(deviceId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
