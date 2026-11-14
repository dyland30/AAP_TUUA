using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class LocalUserAirportDao
{
    private readonly string _cnx;
    public LocalUserAirportDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<LocalUserAirport>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<LocalUserAirport>("select * from public.local_user_airport order by local_user_id, airport_id")).ToList();
    }
    public async Task<LocalUserAirport?> GetById(Guid localUserId, Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<LocalUserAirport>("select * from public.local_user_airport where local_user_id = @localUserId and airport_id = @airportId", new
        {
            localUserId,
            airportId
        });
    }
    public async Task<List<LocalUserAirport>> GetByLocalUserId(Guid localUserId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<LocalUserAirport>("select * from public.local_user_airport where local_user_id = @localUserId order by airport_id", new
        {
            localUserId
        })).ToList();
    }
    public async Task<LocalUserAirport> Add(LocalUserAirport entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"insert into public.local_user_airport (local_user_id, airport_id, is_default, is_active, created_at, updated_at, created_by, modified_by)
            values (@local_user_id, @airport_id, @is_default, @is_active, @created_at, @updated_at, @created_by, @modified_by);", entity);
        return entity;
    }
    public async Task Update(LocalUserAirport entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.local_user_airport set is_default = @is_default, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where local_user_id = @local_user_id and airport_id = @airport_id;", entity);
    }
}
