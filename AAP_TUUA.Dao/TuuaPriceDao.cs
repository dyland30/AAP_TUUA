using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TuuaPriceDao
{
    private readonly string _cnx;

    public TuuaPriceDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<TuuaPrice>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaPrice>(
            "select * from public.tuua_price order by date_start desc");
        return result.ToList();
    }

    public async Task<TuuaPrice?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaPrice>(
            "select * from public.tuua_price where id = @id", new { id });
    }

    public async Task<List<TuuaPrice>> GetByLocationAndTerminal(Guid locationId, Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaPrice>(
            @"select * from public.tuua_price
              where location_id = @locationId and terminal_id = @terminalId
              order by date_start desc", new { locationId, terminalId });
        return result.ToList();
    }

    public async Task<TuuaPrice?> GetActivePrice(int flightTypeId, Guid locationId, Guid terminalId,
        int currencyId, DateTime date)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaPrice>(
            @"select * from public.tuua_price
              where is_active = true
                and flight_type_id = @flightTypeId
                and location_id = @locationId
                and terminal_id = @terminalId
                and currency_id = @currencyId
                and date_start <= @date
                and (date_end is null or date_end >= @date)
              order by date_start desc
              limit 1", new { flightTypeId, locationId, terminalId, currencyId, date });
    }

    public async Task<TuuaPrice> Add(TuuaPrice tuuaPrice)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.tuua_price (flight_type_id, location_id, terminal_id, currency_id,
                             price, date_start, date_end, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@flight_type_id, @location_id, @terminal_id, @currency_id,
                             @price, @date_start, @date_end, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        tuuaPrice.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, tuuaPrice);
        return tuuaPrice;
    }

    public async Task Update(TuuaPrice tuuaPrice)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.tuua_price
                         set flight_type_id = @flight_type_id,
                             location_id = @location_id,
                             terminal_id = @terminal_id,
                             currency_id = @currency_id,
                             price = @price,
                             date_start = @date_start,
                             date_end = @date_end,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, tuuaPrice);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.tuua_price where id = @id", new { id });
    }
}
