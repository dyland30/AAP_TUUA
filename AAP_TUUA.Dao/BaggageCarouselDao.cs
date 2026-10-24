using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class BaggageCarouselDao
{
    private readonly string _cnx;

    public BaggageCarouselDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<BaggageCarousel>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BaggageCarousel>(
            "select * from public.baggage_carousel");
        return result.ToList();
    }

    public async Task<List<BaggageCarousel>> GetByTerminalId(Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BaggageCarousel>(
            "select * from public.baggage_carousel where terminal_id = @terminalId", new { terminalId });
        return result.ToList();
    }

    public async Task<BaggageCarousel?> GetById(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BaggageCarousel>(
            "select * from public.baggage_carousel where resource_id = @resourceId", new { resourceId });
    }

    public async Task<BaggageCarousel> Add(BaggageCarousel carousel)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.baggage_carousel (resource_id, terminal_id,
                             carousel_function_id, belt_length_m)
                         values (@resource_id, @terminal_id, @carousel_function_id, @belt_length_m);";
        await cnn.ExecuteAsync(query, carousel);
        return carousel;
    }

    public async Task Update(BaggageCarousel carousel)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.baggage_carousel
                         set terminal_id = @terminal_id,
                             carousel_function_id = @carousel_function_id,
                             belt_length_m = @belt_length_m
                         where resource_id = @resource_id;";
        await cnn.ExecuteAsync(query, carousel);
    }

    public async Task Delete(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(
            "delete from public.baggage_carousel where resource_id = @resourceId", new { resourceId });
    }
}
