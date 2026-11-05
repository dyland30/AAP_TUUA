using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CompanyDao
{
    private readonly string _cnx;

    public CompanyDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Company>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Company>(
            "select * from public.company order by company_name");
        return result.ToList();
    }

    public async Task<Company?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Company>(
            "select * from public.company where id = @id", new { id });
    }

    public async Task<Company> Add(Company company)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.company (company_name, business_name, document_number, address,
                             is_active, created_at, updated_at, created_by, modified_by)
                         values (@company_name, @business_name, @document_number, @address,
                             @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        company.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, company);
        return company;
    }

    public async Task Update(Company company)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.company
                         set company_name = @company_name,
                             business_name = @business_name,
                             document_number = @document_number,
                             address = @address,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, company);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.company where id = @id", new { id });
    }
}
