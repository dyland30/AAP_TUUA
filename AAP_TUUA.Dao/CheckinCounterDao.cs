using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CheckinCounterDao
{
    private readonly string _cnx;

    public CheckinCounterDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<CheckinCounter>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CheckinCounter>(
            "select * from public.checkin_counter order by island");
        return result.ToList();
    }

    public async Task<List<CheckinCounter>> GetByTerminalId(Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CheckinCounter>(
            "select * from public.checkin_counter where terminal_id = @terminalId order by island",
            new { terminalId });
        return result.ToList();
    }

    public async Task<CheckinCounter?> GetById(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<CheckinCounter>(
            "select * from public.checkin_counter where resource_id = @resourceId", new { resourceId });
    }

    public async Task<CheckinCounter> Add(CheckinCounter counter)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.checkin_counter (resource_id, terminal_id, island,
                             counter_type_id, has_baggage_belt, is_common_use)
                         values (@resource_id, @terminal_id, @island,
                             @counter_type_id, @has_baggage_belt, @is_common_use);";
        await cnn.ExecuteAsync(query, counter);
        return counter;
    }

    public async Task Update(CheckinCounter counter)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.checkin_counter
                         set terminal_id = @terminal_id,
                             island = @island,
                             counter_type_id = @counter_type_id,
                             has_baggage_belt = @has_baggage_belt,
                             is_common_use = @is_common_use
                         where resource_id = @resource_id;";
        await cnn.ExecuteAsync(query, counter);
    }

    public async Task Delete(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(
            "delete from public.checkin_counter where resource_id = @resourceId", new { resourceId });
    }
}
