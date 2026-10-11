using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class UbigeoDepartamentoDao
{
    private readonly string _cnx;

    public UbigeoDepartamentoDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<UbigeoDepartamento>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<UbigeoDepartamento>("select * from public.ubigeo_departamento order by nombre");
        return result.ToList();
    }

    public async Task<UbigeoDepartamento?> GetByCodigo(string codigo)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<UbigeoDepartamento>(
            "select * from public.ubigeo_departamento where codigo = @codigo", new { codigo });
    }

    public async Task<UbigeoDepartamento> Add(UbigeoDepartamento departamento)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.ubigeo_departamento (codigo, nombre)
                         values (@codigo, @nombre);";
        await cnn.ExecuteAsync(query, departamento);
        return departamento;
    }

    public async Task Update(UbigeoDepartamento departamento)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.ubigeo_departamento
                         set nombre = @nombre
                         where codigo = @codigo;";
        await cnn.ExecuteAsync(query, departamento);
    }

    public async Task Delete(string codigo)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.ubigeo_departamento where codigo = @codigo", new { codigo });
    }
}
