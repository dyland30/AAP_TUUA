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
public class PassengerLoadingBridgeController : ControllerBase
{
    private readonly PassengerLoadingBridgeBL _bridgeBl;
    private readonly TokenUtil _tokenUtil;

    public PassengerLoadingBridgeController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _bridgeBl = new PassengerLoadingBridgeBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _bridgeBl.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetById/{resourceId}")]
    public async Task<IActionResult> GetById(Guid resourceId)
    {
        try
        {
            return Ok(await _bridgeBl.GetById(resourceId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByBoardingGateId/{boardingGateId}")]
    public async Task<IActionResult> GetByBoardingGateId(Guid boardingGateId)
    {
        try
        {
            return Ok(await _bridgeBl.GetByBoardingGateId(boardingGateId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByStandId/{standId}")]
    public async Task<IActionResult> GetByStandId(Guid standId)
    {
        try
        {
            return Ok(await _bridgeBl.GetByStandId(standId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] PassengerLoadingBridge bridge)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _bridgeBl.Add(bridge, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] PassengerLoadingBridge bridge)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _bridgeBl.Update(bridge, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{resourceId}")]
    public async Task<IActionResult> Delete(Guid resourceId)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _bridgeBl.Delete(resourceId, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
