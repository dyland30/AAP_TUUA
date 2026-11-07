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
public class TuuaGateUnlockKeyController : ControllerBase
{
    private readonly TuuaGateUnlockKeyBL _tuuaGateUnlockKeyBl;
    private readonly TuuaGateUnlockKeyPdfBL _tuuaGateUnlockKeyPdfBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaGateUnlockKeyController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaGateUnlockKeyBl = new TuuaGateUnlockKeyBL(cnx);
        _tuuaGateUnlockKeyPdfBl = new TuuaGateUnlockKeyPdfBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _tuuaGateUnlockKeyBl.GetAll());
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
            return Ok(await _tuuaGateUnlockKeyBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("Pdf/{id}")]
    public async Task<IActionResult> Pdf(Guid id)
    {
        try
        {
            var pdf = await _tuuaGateUnlockKeyPdfBl.Generate(id);
            return File(pdf, "application/pdf", $"llave-destrabe-{id}.pdf");
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByUserId/{userId}")]
    public async Task<IActionResult> GetByUserId(Guid userId)
    {
        try
        {
            return Ok(await _tuuaGateUnlockKeyBl.GetByUserId(userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] TuuaGateUnlockKey tuuaGateUnlockKey)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaGateUnlockKeyBl.Add(tuuaGateUnlockKey, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] TuuaGateUnlockKey tuuaGateUnlockKey)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaGateUnlockKeyBl.Update(tuuaGateUnlockKey, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("Delete/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _tuuaGateUnlockKeyBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
