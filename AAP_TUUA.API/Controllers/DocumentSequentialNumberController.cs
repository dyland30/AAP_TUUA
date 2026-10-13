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
public class DocumentSequentialNumberController : ControllerBase
{
    private readonly DocumentSequentialNumberBL _documentSequentialNumberBl;
    private readonly TokenUtil _tokenUtil;

    public DocumentSequentialNumberController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _documentSequentialNumberBl = new DocumentSequentialNumberBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetByGroupId/{documentSerialGroupId}")]
    public async Task<IActionResult> GetByGroupId(Guid documentSerialGroupId)
    {
        try
        {
            return Ok(await _documentSequentialNumberBl.GetByGroupId(documentSerialGroupId));
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
            return Ok(await _documentSequentialNumberBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] DocumentSequentialNumber number)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _documentSequentialNumberBl.Add(number, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] DocumentSequentialNumber number)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _documentSequentialNumberBl.Update(number, userId));
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
            await _documentSequentialNumberBl.Delete(id);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
