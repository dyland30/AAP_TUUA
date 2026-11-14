using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class LocalUserAirlineDao
{
    private readonly string _cnx;
    public LocalUserAirlineDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<LocalUserAirline>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<LocalUserAirline>("select * from public.local_user_airline order by local_user_id, airline_id")).ToList();
    }
    public async Task<LocalUserAirline?> GetById(Guid localUserId, Guid airlineId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<LocalUserAirline>("select * from public.local_user_airline where local_user_id = @localUserId and airline_id = @airlineId", new
        {
            localUserId,
            airlineId
        });
    }
    public async Task<List<LocalUserAirline>> GetByLocalUserId(Guid localUserId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<LocalUserAirline>("select * from public.local_user_airline where local_user_id = @localUserId order by airline_id", new
        {
            localUserId
        })).ToList();
    }
    public async Task<LocalUserAirline> Add(LocalUserAirline entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"insert into public.local_user_airline (local_user_id, airline_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@local_user_id, @airline_id, @is_active, @created_at, @updated_at, @created_by, @modified_by);", entity);
        return entity;
    }
    public async Task Update(LocalUserAirline entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.local_user_airline set is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by
            where local_user_id = @local_user_id and airline_id = @airline_id;", entity);
    }
}
