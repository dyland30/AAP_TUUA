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
public class ResourceController : ControllerBase
{
    private readonly ResourceBL _resourceBl;
    private readonly TokenUtil _tokenUtil;
    
    public ResourceController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _resourceBl = new ResourceBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }
    
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _resourceBl.GetAll());
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
            return Ok(await _resourceBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetMenu")]
    public async Task<IActionResult> GetMenu()
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            if (!Guid.TryParse(userId, out var id))
            {
                return Unauthorized();
            }

            return Ok(await _resourceBl.GetMenuByUserId(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] Resource resource)
    {
        try
        {
            string idUser =  _tokenUtil.GetUserIdFromToken(Request) ?? "";
            return Ok(await _resourceBl.Add(resource, idUser));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] Resource resource)
    {
        try
        {
            string idUser =  _tokenUtil.GetUserIdFromToken(Request) ?? "";
            return Ok(await _resourceBl.Update(resource, idUser));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
}