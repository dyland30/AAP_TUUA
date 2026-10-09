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
public class LocalUserController : ControllerBase
{
    private readonly LocalUserBL _localUserBl;
    private readonly TokenUtil _tokenUtil;

    public LocalUserController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _localUserBl = new LocalUserBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _localUserBl.GetAll());
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
            var localUser = await _localUserBl.GetById(id);
            if (localUser is null)
            {
                return NotFound();
            }

            return Ok(localUser);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] LocalUser localUser)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            await _localUserBl.Add(localUser, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("AddUserRole")]
    public async Task<IActionResult> AddUserRole([FromBody] UserRole userRole)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            await _localUserBl.AddUserRole(userRole, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] LocalUser localUser)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            await _localUserBl.Update(localUser, userId);
            return Ok();
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
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            await _localUserBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetUsersByRoleId/{roleId}")]
    public async Task<IActionResult> GetUsersByRoleId(Guid roleId)
    {
        try
        {
            return Ok(await _localUserBl.GetUsersByRoleId(roleId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetUsersByPermissionAndResource/{permissionName}/{resourcePath}")]
    public async Task<IActionResult> GetUsersByPermissionAndResource(string permissionName, string resourcePath)
    {
        try
        {
            return Ok(await _localUserBl.GetUsersByPermissionAndResource(permissionName, resourcePath));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
