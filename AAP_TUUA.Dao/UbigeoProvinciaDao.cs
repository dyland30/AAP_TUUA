using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class UbigeoProvinciaDao
{
    private readonly string _cnx;

    public UbigeoProvinciaDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<UbigeoProvincia>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<UbigeoProvincia>("select * from public.ubigeo_provincia order by nombre");
        return result.ToList();
    }

    public async Task<UbigeoProvincia?> GetByCodigo(string codigo)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<UbigeoProvincia>(
            "select * from public.ubigeo_provincia where codigo = @codigo", new { codigo });
    }

    public async Task<List<UbigeoProvincia>> GetByDepartamento(string codigoDepartamento)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<UbigeoProvincia>(
            "select * from public.ubigeo_provincia where codigo_departamento = @codigoDepartamento order by nombre",
            new { codigoDepartamento });
        return result.ToList();
    }

    public async Task<UbigeoProvincia> Add(UbigeoProvincia provincia)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.ubigeo_provincia (codigo, codigo_departamento, nombre)
                         values (@codigo, @codigo_departamento, @nombre);";
        await cnn.ExecuteAsync(query, provincia);
        return provincia;
    }

    public async Task Update(UbigeoProvincia provincia)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.ubigeo_provincia
                         set codigo_departamento = @codigo_departamento,
                             nombre = @nombre
                         where codigo = @codigo;";
        await cnn.ExecuteAsync(query, provincia);
    }

    public async Task Delete(string codigo)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.ubigeo_provincia where codigo = @codigo", new { codigo });
    }
}
