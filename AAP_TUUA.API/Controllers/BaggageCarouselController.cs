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
public class BaggageCarouselController : ControllerBase
{
    private readonly BaggageCarouselBL _baggageCarouselBl;
    private readonly TokenUtil _tokenUtil;

    public BaggageCarouselController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _baggageCarouselBl = new BaggageCarouselBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _baggageCarouselBl.GetAll());
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
            return Ok(await _baggageCarouselBl.GetById(resourceId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByTerminalId/{terminalId}")]
    public async Task<IActionResult> GetByTerminalId(Guid terminalId)
    {
        try
        {
            return Ok(await _baggageCarouselBl.GetByTerminalId(terminalId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] BaggageCarousel carousel)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _baggageCarouselBl.Add(carousel, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] BaggageCarousel carousel)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _baggageCarouselBl.Update(carousel, userId));
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
            await _baggageCarouselBl.Delete(resourceId, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
