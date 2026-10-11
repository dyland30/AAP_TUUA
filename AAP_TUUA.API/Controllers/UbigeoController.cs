using System.Net;
using AAP_TUUA.API.Filters;
using AAP_TUUA.Business;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AuthFilter]
public class UbigeoController : ControllerBase
{
    private readonly UbigeoBL _ubigeoBl;

    public UbigeoController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _ubigeoBl = new UbigeoBL(cnx);
    }

    [HttpGet("GetAllDepartamentos")]
    public async Task<IActionResult> GetAllDepartamentos()
    {
        try
        {
            return Ok(await _ubigeoBl.GetAllDepartamentos());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetDepartamentoByCodigo/{codigo}")]
    public async Task<IActionResult> GetDepartamentoByCodigo(string codigo)
    {
        try
        {
            return Ok(await _ubigeoBl.GetDepartamentoByCodigo(codigo));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("AddDepartamento")]
    public async Task<IActionResult> AddDepartamento([FromBody] UbigeoDepartamento departamento)
    {
        try
        {
            return Ok(await _ubigeoBl.AddDepartamento(departamento));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("UpdateDepartamento")]
    public async Task<IActionResult> UpdateDepartamento([FromBody] UbigeoDepartamento departamento)
    {
        try
        {
            return Ok(await _ubigeoBl.UpdateDepartamento(departamento));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("DeleteDepartamento/{codigo}")]
    public async Task<IActionResult> DeleteDepartamento(string codigo)
    {
        try
        {
            await _ubigeoBl.DeleteDepartamento(codigo);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetAllProvincias")]
    public async Task<IActionResult> GetAllProvincias()
    {
        try
        {
            return Ok(await _ubigeoBl.GetAllProvincias());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetProvinciaByCodigo/{codigo}")]
    public async Task<IActionResult> GetProvinciaByCodigo(string codigo)
    {
        try
        {
            return Ok(await _ubigeoBl.GetProvinciaByCodigo(codigo));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetProvinciasByDepartamento/{codigoDepartamento}")]
    public async Task<IActionResult> GetProvinciasByDepartamento(string codigoDepartamento)
    {
        try
        {
            return Ok(await _ubigeoBl.GetProvinciasByDepartamento(codigoDepartamento));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("AddProvincia")]
    public async Task<IActionResult> AddProvincia([FromBody] UbigeoProvincia provincia)
    {
        try
        {
            return Ok(await _ubigeoBl.AddProvincia(provincia));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("UpdateProvincia")]
    public async Task<IActionResult> UpdateProvincia([FromBody] UbigeoProvincia provincia)
    {
        try
        {
            return Ok(await _ubigeoBl.UpdateProvincia(provincia));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("DeleteProvincia/{codigo}")]
    public async Task<IActionResult> DeleteProvincia(string codigo)
    {
        try
        {
            await _ubigeoBl.DeleteProvincia(codigo);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetAllDistritos")]
    public async Task<IActionResult> GetAllDistritos()
    {
        try
        {
            return Ok(await _ubigeoBl.GetAllDistritos());
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetDistritoByCodigo/{codigo}")]
    public async Task<IActionResult> GetDistritoByCodigo(string codigo)
    {
        try
        {
            return Ok(await _ubigeoBl.GetDistritoByCodigo(codigo));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetDistritosByProvincia/{codigoProvincia}")]
    public async Task<IActionResult> GetDistritosByProvincia(string codigoProvincia)
    {
        try
        {
            return Ok(await _ubigeoBl.GetDistritosByProvincia(codigoProvincia));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("AddDistrito")]
    public async Task<IActionResult> AddDistrito([FromBody] UbigeoDistrito distrito)
    {
        try
        {
            return Ok(await _ubigeoBl.AddDistrito(distrito));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPut("UpdateDistrito")]
    public async Task<IActionResult> UpdateDistrito([FromBody] UbigeoDistrito distrito)
    {
        try
        {
            return Ok(await _ubigeoBl.UpdateDistrito(distrito));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpDelete("DeleteDistrito/{codigo}")]
    public async Task<IActionResult> DeleteDistrito(string codigo)
    {
        try
        {
            await _ubigeoBl.DeleteDistrito(codigo);
            return Ok();
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
