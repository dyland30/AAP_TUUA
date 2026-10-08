using System.Net;
using AAP_TUUA.API.Util;
using AAP_TUUA.Business;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace AAP_TUUA.API.Controllers;
[ApiController]
[Route("api/[controller]")]
public class FeatureController: ControllerBase
{
    private readonly FeatureBL _featureBL;
    private readonly TokenUtil _tokenUtil;

    public FeatureController(IConfiguration config)
    {
        var cnx = config.GetValue<string>("connectionString")??"";
        _featureBL = new FeatureBL(cnx);
        _tokenUtil = new TokenUtil(config);
        
        
    }
    
    [HttpGet("GetAllFeatureGroups")]
    public async Task<IActionResult> GetAllFeatureGroups()
    {
        try
        {
            var featureGroups = await _featureBL.GetAllFeatureGroups();
            return Ok(featureGroups);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
    [HttpGet("GetFeaturesByGroup/{groupId}")]
    public async Task<IActionResult> GetFeaturesByGroup(int groupId)
    {
        try
        {
            var features = await _featureBL.GetFeaturesByGroup(groupId);
            return Ok(features);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
        
    }
    
    [HttpPost("AddFeatureGroup")]
    public async Task<IActionResult> AddFeatureGroup([FromBody] FeatureGroup featureGroup)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            var result = await _featureBL.AddFeatureGroup(featureGroup, userId);
            return Ok(result);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
    
    [HttpPut("UpdateFeatureGroup")]
    public async Task<IActionResult> UpdateFeatureGroup([FromBody] FeatureGroup featureGroup)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            var result = await _featureBL.UpdateFeatureGroup(featureGroup, userId);
            return Ok(result);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
    [HttpPost("AddFeature")]
    public async Task<IActionResult> AddFeature([FromBody] Feature feature)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            var result = await _featureBL.AddFeature(feature, userId);
            return Ok(result);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
    [HttpPut("UpdateFeature")]
    public async Task<IActionResult> UpdateFeature([FromBody] Feature feature)
    {
        try
        {
            var userId = _tokenUtil.GetUserIdFromToken(Request);
            var result = await _featureBL.UpdateFeature(feature, userId);
            return Ok(result);
        }
        catch (Exception e)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, e.Message);
        }
    }
    
}