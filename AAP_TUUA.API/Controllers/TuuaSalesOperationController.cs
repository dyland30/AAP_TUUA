using System.Net;
using AAP_TUUA.API.Filters;
using AAP_TUUA.API.Util;
using AAP_TUUA.Business;
using AAP_TUUA.Business.Dto;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AuthFilter]
public class TuuaSalesOperationController : ControllerBase
{
    private readonly TuuaSalesOperationBL _tuuaSalesOperationBl;
    private readonly TuuaTicketPdfBL _tuuaTicketPdfBl;
    private readonly EmailBL _emailBl;
    private readonly TokenUtil _tokenUtil;

    public TuuaSalesOperationController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString") ?? "";
        _tuuaSalesOperationBl = new TuuaSalesOperationBL(cnx);
        _tuuaTicketPdfBl = new TuuaTicketPdfBL(cnx);
        _emailBl = new EmailBL(config.GetSection("Smtp").Get<SmtpSettings>());
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

    [HttpGet("GetSaleContext")]
    public async Task<IActionResult> GetSaleContext()
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaSalesOperationBl.GetSaleContext(userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetSalePricing/{flightTypeId}")]
    public async Task<IActionResult> GetSalePricing(int flightTypeId)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaSalesOperationBl.GetSalePricing(flightTypeId, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("GetFlightsForSale/{flightTypeId}")]
    public async Task<IActionResult> GetFlightsForSale(int flightTypeId)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaSalesOperationBl.GetFlightsForSale(flightTypeId, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("Sell")]
    public async Task<IActionResult> Sell([FromBody] TuuaTicketSaleRequest request)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            return Ok(await _tuuaSalesOperationBl.Sell(request, userId));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] TuuaSalesOperationSearchFilter filter)
    {
        try
        {
            return Ok(await _tuuaSalesOperationBl.Search(filter));
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpGet("TicketsPdf/{id}")]
    public async Task<IActionResult> TicketsPdf(Guid id, [FromQuery] Guid? ticketId = null)
    {
        try
        {
            var pdf = await _tuuaTicketPdfBl.Generate(id, ticketId);
            return File(pdf, "application/pdf", $"tickets-tuua-{ticketId ?? id}.pdf");
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }

    [HttpPost("SendTicketsEmail/{id}")]
    public async Task<IActionResult> SendTicketsEmail(Guid id, [FromBody] TuuaTicketEmailRequest request)
    {
        try
        {
            var email = await _tuuaTicketPdfBl.SendByEmail(id, request.email, _emailBl);
            return Ok(new { email });
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
