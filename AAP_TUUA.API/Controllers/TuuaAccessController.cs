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
public class TuuaAccessController: ControllerBase
{
    private readonly TokenUtil _tokenUtil;
    private readonly TuuaAccessControlBL _tuuaAccessControlBL;

    public TuuaAccessController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaAccessControlBL = new TuuaAccessControlBL(cnx);
        _tokenUtil = new TokenUtil(config);
    }

    [HttpPost("ProcessTuuaAccess")]
    public async Task<IActionResult> ProcessTuuaAccess([FromBody] TuuaPayload payload)
    {
        var resp = new TuuaResponse()
        {
            response = "ok",
            color = "green",
            message = "registro satisfactorio"
        };
        try
        {
            
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            await _tuuaAccessControlBL.ProcessTuuaAccess(payload, userId);
            return Ok(resp);
        }
        catch (Exception ex)
        {
            resp = new TuuaResponse()
            {
                response = "error",
                color = "red",
                message = ex.Message
            };
            return Ok(resp);
        }
        
    }
    
    
    
}