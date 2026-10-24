using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class BaggageCarouselBL
{
    private readonly BaggageCarouselDao _baggageCarouselDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly TerminalDao _terminalDao;
    private readonly FeatureDao _featureDao;
    private readonly BaggageCarouselValidator _baggageCarouselValidator;

    public BaggageCarouselBL(string cnx)
    {
        _baggageCarouselDao = new BaggageCarouselDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _baggageCarouselValidator = new BaggageCarouselValidator();
    }

    public async Task<IEnumerable<BaggageCarousel>?> GetAll()
    {
        return await _baggageCarouselDao.GetAll();
    }

    public async Task<IEnumerable<BaggageCarousel>?> GetByTerminalId(Guid terminalId)
    {
        return await _baggageCarouselDao.GetByTerminalId(terminalId);
    }

    public async Task<BaggageCarousel?> GetById(Guid resourceId)
    {
        return await _baggageCarouselDao.GetById(resourceId);
    }

    public async Task<BaggageCarousel> Add(BaggageCarousel carousel, string? userId)
    {
        var result = await _baggageCarouselValidator.ValidateAsync(carousel);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(carousel);

        if (await _baggageCarouselDao.GetById(carousel.resource_id!.Value) is not null)
        {
            throw new Exception("Baggage carousel already exists for this resource");
        }

        return await _baggageCarouselDao.Add(carousel);
    }

    public async Task<BaggageCarousel> Update(BaggageCarousel carousel, string? userId)
    {
        var result = await _baggageCarouselValidator.ValidateAsync(carousel);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (carousel.resource_id == null || carousel.resource_id == Guid.Empty)
        {
            throw new Exception("Baggage carousel resource id is required");
        }

        if (await _baggageCarouselDao.GetById(carousel.resource_id.Value) is null)
        {
            throw new Exception("Baggage carousel not found");
        }

        await ValidateReferences(carousel);

        await _baggageCarouselDao.Update(carousel);
        return carousel;
    }

    public async Task Delete(Guid resourceId, string? userId)
    {
        if (await _baggageCarouselDao.GetById(resourceId) is null)
        {
            throw new Exception("Baggage carousel not found");
        }

        await _baggageCarouselDao.Delete(resourceId);
    }

    private async Task ValidateReferences(BaggageCarousel carousel)
    {
        if (await _airportResourceDao.GetById(carousel.resource_id!.Value) is null)
        {
            throw new Exception("Airport resource not found");
        }

        if (await _terminalDao.GetById(carousel.terminal_id) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (await _featureDao.GetFeatureById(carousel.carousel_function_id) is null)
        {
            throw new Exception("Carousel function not found");
        }
    }
}
