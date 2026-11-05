using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class ExchangeRateDao
{
    private readonly string _cnx;

    public ExchangeRateDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<ExchangeRate>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<ExchangeRate>(
            "select * from public.exchange_rate order by day desc");
        return result.ToList();
    }

    public async Task<ExchangeRate?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<ExchangeRate>(
            "select * from public.exchange_rate where id = @id", new { id });
    }

    public async Task<List<ExchangeRate>> GetByCurrencies(int baseCurrencyId, int targetCurrencyId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<ExchangeRate>(
            @"select * from public.exchange_rate
              where base_currency_id = @baseCurrencyId and target_currency_id = @targetCurrencyId
              order by day desc", new { baseCurrencyId, targetCurrencyId });
        return result.ToList();
    }

    public async Task<ExchangeRate?> GetByDayAndCurrencies(DateTime day, int baseCurrencyId, int targetCurrencyId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<ExchangeRate>(
            @"select * from public.exchange_rate
              where day = @day
                and base_currency_id = @baseCurrencyId
                and target_currency_id = @targetCurrencyId
                and is_active = true
              limit 1", new { day, baseCurrencyId, targetCurrencyId });
    }

    public async Task<ExchangeRate> Add(ExchangeRate exchangeRate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.exchange_rate (day, base_currency_id, target_currency_id,
                             purchase_exchange_rate, sales_exchange_rate, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@day, @base_currency_id, @target_currency_id,
                             @purchase_exchange_rate, @sales_exchange_rate, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        exchangeRate.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, exchangeRate);
        return exchangeRate;
    }

    public async Task Update(ExchangeRate exchangeRate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.exchange_rate
                         set day = @day,
                             base_currency_id = @base_currency_id,
                             target_currency_id = @target_currency_id,
                             purchase_exchange_rate = @purchase_exchange_rate,
                             sales_exchange_rate = @sales_exchange_rate,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, exchangeRate);
    }
}
