using System.Net;
using AAP_TUUA.API.Filters;
using AAP_TUUA.Business;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AuthFilter]
public class CashierMachineSessionReportController : ControllerBase
{
    private readonly CashierMachineSessionReportBL _reportBl;

    public CashierMachineSessionReportController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _reportBl = new CashierMachineSessionReportBL(cnx);
    }

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] CashierMachineSessionReportFilter filter)
    {
        try
        {
            return Ok(await _reportBl.Search(filter));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("Export")]
    public async Task<IActionResult> Export([FromQuery] CashierMachineSessionReportFilter filter)
    {
        try
        {
            var xlsx = await _reportBl.Export(filter);
            return File(xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"reporte-turnos-{DateTime.Now:yyyyMMdd-HHmmss}.xlsx");
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
}
