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
public class TuuaGateUnlockKeyUsageHistoryController : ControllerBase
{
    private readonly TuuaGateUnlockKeyUsageHistoryBL _historyBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaGateUnlockKeyUsageHistoryController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _historyBl = new TuuaGateUnlockKeyUsageHistoryBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _historyBl.GetAll());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] TuuaGateUnlockKeyUsageFilter filter)
    {
        try
        {
            return Ok(await _historyBl.Search(filter));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("Export")]
    public async Task<IActionResult> Export([FromQuery] TuuaGateUnlockKeyUsageFilter filter)
    {
        try
        {
            var xlsx = await _historyBl.Export(filter);
            return File(xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"uso-llaves-destrabe-{DateTime.Now:yyyyMMdd-HHmmss}.xlsx");
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
            return Ok(await _historyBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByTuuaGateCode/{tuuaGateCode}")]
    public async Task<IActionResult> GetByTuuaGateCode(string tuuaGateCode)
    {
        try
        {
            return Ok(await _historyBl.GetByTuuaGateCode(tuuaGateCode));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] TuuaGateUnlockKeyUsageHistory history)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _historyBl.Add(history, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
