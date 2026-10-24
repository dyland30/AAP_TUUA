using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class BoardingGateDao
{
    private readonly string _cnx;

    public BoardingGateDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<BoardingGate>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BoardingGate>("select * from public.boarding_gate");
        return result.ToList();
    }

    public async Task<List<BoardingGate>> GetByTerminalId(Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BoardingGate>(
            @"select bg.* from public.boarding_gate bg
              inner join public.airport_resource r on r.id = bg.resource_id
              where r.terminal_id = @terminalId
              order by r.code", new { terminalId });
        return result.ToList();
    }

    public async Task<BoardingGate?> GetById(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BoardingGate>(
            "select * from public.boarding_gate where resource_id = @resourceId", new { resourceId });
    }

    public async Task<BoardingGate> Add(BoardingGate boardingGate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.boarding_gate (resource_id, boarding_type_id, default_stand_id,
                             is_active, created_at, updated_at, created_by, modified_by)
                         values (@resource_id, @boarding_type_id, @default_stand_id,
                             @is_active, @created_at, @updated_at, @created_by, @modified_by);";
        await cnn.ExecuteAsync(query, boardingGate);
        return boardingGate;
    }

    public async Task Update(BoardingGate boardingGate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.boarding_gate
                         set boarding_type_id = @boarding_type_id,
                             default_stand_id = @default_stand_id,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where resource_id = @resource_id;";
        await cnn.ExecuteAsync(query, boardingGate);
    }

    public async Task Delete(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.boarding_gate where resource_id = @resourceId", new { resourceId });
    }
}
