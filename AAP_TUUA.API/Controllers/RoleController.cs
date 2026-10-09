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
public class RoleController : ControllerBase
{
    private readonly RoleBL _roleBl;
    private readonly TokenUtil _tokenUtil;

    public RoleController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _roleBl = new RoleBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _roleBl.GetAll());
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
            return Ok(await _roleBl.GetById(id));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] Role role)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            return Ok(await _roleBl.Add(role, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] Role role)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            await _roleBl.Update(role, userId);
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
            await _roleBl.Delete(id, userId);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("AddRoleResource")]
    public async Task<IActionResult> AddRoleResource([FromBody] RoleResource roleResource)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request) ?? "";
            return Ok(await _roleBl.AddRoleResource(roleResource, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("RemoveRoleResource")]
    public async Task<IActionResult> RemoveRoleResource([FromBody] RoleResource roleResource)
    {
        try
        {
            await _roleBl.RemoveRoleResource(roleResource);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("AddRoleResourcePermission")]
    public async Task<IActionResult> AddRoleResourcePermission([FromBody] RoleResourcePermissions roleResourcePermission)
    {
        try
        {
            await _roleBl.AddRoleResourcePermission(roleResourcePermission);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("RemoveRoleResourcePermission")]
    public async Task<IActionResult> RemoveRoleResourcePermission([FromBody] RoleResourcePermissions roleResourcePermission)
    {
        try
        {
            await _roleBl.RemoveRoleResourcePermission(roleResourcePermission);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetPermissionsByRoleIdAndResourceId/{roleId}/{resourceId}")]
    public async Task<IActionResult> GetPermissionsByRoleIdAndResourceId(Guid roleId, Guid resourceId)
    {
        try
        {
            return Ok(await _roleBl.GetPermissionsByRoleIdAndResourceId(roleId, resourceId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetRoleResourcePermissionByIds/{roleId}/{resourceId}/{permissionId}")]
    public async Task<IActionResult> GetRoleResourcePermissionByIds(Guid roleId, Guid resourceId, int permissionId)
    {
        try
        {
            return Ok(await _roleBl.GetRoleResourcePermissionByIds(roleId, resourceId, permissionId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
