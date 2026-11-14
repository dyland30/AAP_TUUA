using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AuditLogDao
{
    private readonly string _cnx;
    public AuditLogDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<AuditLog>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AuditLog>("select * from public.audit_log order by occurred_at desc, id desc")).ToList();
    }
    public async Task<AuditLog?> GetById(long id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AuditLog>("select * from public.audit_log where id = @id", new
        {
            id
        });
    }
    public async Task<List<AuditLog>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AuditLog>("select * from public.audit_log where airport_id = @airportId order by occurred_at desc, id desc", new
        {
            airportId
        })).ToList();
    }
    public async Task<AuditLog> Add(AuditLog entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.audit_log (airport_id, local_user_id, username, action_id, entity_name, entity_id,
            description, old_values, new_values, ip_address, user_agent, occurred_at, created_at, created_by)
            values (@airport_id, @local_user_id, @username, @action_id, @entity_name, @entity_id, @description,
            cast(@old_values as jsonb), cast(@new_values as jsonb), @ip_address, @user_agent, @occurred_at, @created_at, @created_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<long>(query, entity);
        return entity;
    }
}
