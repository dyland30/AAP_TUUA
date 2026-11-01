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
public class BoardingpassDaeSeaeController : ControllerBase
{
    private readonly BoardingpassDaeSeaeBL _boardingpassBl;
    private readonly TokenUtil _tokenUtil;

    public BoardingpassDaeSeaeController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _boardingpassBl = new BoardingpassDaeSeaeBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _boardingpassBl.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetById/{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            return Ok(await _boardingpassBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByFlight")]
    public async Task<IActionResult> GetByFlight([FromQuery] string flightNumber, [FromQuery] DateTime flightDate)
    {
        try
        {
            return Ok(await _boardingpassBl.GetByFlight(flightNumber, flightDate));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] BoardingpassDaeSeae boardingpass)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _boardingpassBl.Add(boardingpass, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
