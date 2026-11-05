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
public class TuuaSalesOperationController : ControllerBase
{
    private readonly TuuaSalesOperationBL _tuuaSalesOperationBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaSalesOperationController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaSalesOperationBl = new TuuaSalesOperationBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _tuuaSalesOperationBl.GetAll());
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
            return Ok(await _tuuaSalesOperationBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetByCashierMachineSessionId/{cashierMachineSessionId}")]
    public async Task<IActionResult> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        try
        {
            return Ok(await _tuuaSalesOperationBl.GetByCashierMachineSessionId(cashierMachineSessionId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] TuuaSalesOperation salesOperation)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaSalesOperationBl.Add(salesOperation, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] TuuaSalesOperation salesOperation)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaSalesOperationBl.Update(salesOperation, userId));
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
            await _tuuaSalesOperationBl.Delete(id);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
