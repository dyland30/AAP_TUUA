using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class UbigeoDistritoDao
{
    private readonly string _cnx;

    public UbigeoDistritoDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<UbigeoDistrito>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<UbigeoDistrito>("select * from public.ubigeo_distrito order by nombre");
        return result.ToList();
    }

    public async Task<UbigeoDistrito?> GetByCodigo(string codigo)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<UbigeoDistrito>(
            "select * from public.ubigeo_distrito where codigo = @codigo", new { codigo });
    }

    public async Task<List<UbigeoDistrito>> GetByProvincia(string codigoProvincia)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<UbigeoDistrito>(
            "select * from public.ubigeo_distrito where codigo_provincia = @codigoProvincia order by nombre",
            new { codigoProvincia });
        return result.ToList();
    }

    public async Task<UbigeoDistrito> Add(UbigeoDistrito distrito)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.ubigeo_distrito (codigo, codigo_provincia, nombre)
                         values (@codigo, @codigo_provincia, @nombre);";
        await cnn.ExecuteAsync(query, distrito);
        return distrito;
    }

    public async Task Update(UbigeoDistrito distrito)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.ubigeo_distrito
                         set codigo_provincia = @codigo_provincia,
                             nombre = @nombre
                         where codigo = @codigo;";
        await cnn.ExecuteAsync(query, distrito);
    }

    public async Task Delete(string codigo)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.ubigeo_distrito where codigo = @codigo", new { codigo });
    }
}
