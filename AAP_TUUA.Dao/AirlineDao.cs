using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AirlineDao
{
    private readonly string _cnx;

    public AirlineDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Airline>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Airline>("select * from airline order by company_name");
        return result.ToList();
    }

    public async Task<Airline?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Airline>("select * from airline where id = @id", new { id });
    }

    public async Task<Airline> Add(Airline airline)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into airline (company_name, ruc, cod_sap, oaci_code, iata_code, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@company_name, @ruc, @cod_sap, @oaci_code, @iata_code, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        airline.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, airline);
        return airline;
    }

    public async Task Update(Airline airline)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update airline
                         set company_name = @company_name,
                             ruc = @ruc,
                             cod_sap = @cod_sap,
                             oaci_code = @oaci_code,
                             iata_code = @iata_code,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, airline);
    }
}
