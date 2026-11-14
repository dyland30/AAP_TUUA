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
public class AdCampaignBehaviorGroupController : ControllerBase
{
    private readonly AdCampaignBehaviorGroupBL _bl;
    private readonly TokenUtil _tokenUtil;
    public AdCampaignBehaviorGroupController(IConfiguration config)
    {
        _bl = new AdCampaignBehaviorGroupBL(config.GetValue<string>("connectionString") ?? "");
        _tokenUtil = new TokenUtil(config);
    }
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            return Ok(await _bl.GetAll());
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetById/{adCampaignId}/{behaviorGroupId}")]
    public async Task<IActionResult> GetById(Guid adCampaignId, Guid behaviorGroupId)
    {
        try
        {
            return Ok(await _bl.GetById(adCampaignId, behaviorGroupId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpGet("GetByAdCampaignId/{adCampaignId}")]
    public async Task<IActionResult> GetByAdCampaignId(Guid adCampaignId)
    {
        try
        {
            return Ok(await _bl.GetByAdCampaignId(adCampaignId));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPost("Add")]
    public async Task<IActionResult> Add([FromBody] AdCampaignBehaviorGroup entity)
    {
        try
        {
            return Ok(await _bl.Add(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] AdCampaignBehaviorGroup entity)
    {
        try
        {
            return Ok(await _bl.Update(entity, _tokenUtil.GetUserIdFromToken(Request)));
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
    [HttpDelete("Delete/{adCampaignId}/{behaviorGroupId}")]
    public async Task<IActionResult> Delete(Guid adCampaignId, Guid behaviorGroupId)
    {
        try
        {
            await _bl.Delete(adCampaignId, behaviorGroupId, _tokenUtil.GetUserIdFromToken(Request));
            return Ok();
        }
        catch (Exception e) { return StatusCode((int)HttpStatusCode.InternalServerError, e.Message); }
    }
}
