using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class VideoWallDao
{
    private readonly string _cnx;
    public VideoWallDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<VideoWall>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<VideoWall>("select * from public.video_wall order by code")).ToList();
    }
    public async Task<VideoWall?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<VideoWall>("select * from public.video_wall where id = @id", new
        {
            id
        });
    }
    public async Task<List<VideoWall>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<VideoWall>("select * from public.video_wall where airport_id = @airportId order by code", new
        {
            airportId
        })).ToList();
    }
    public async Task<VideoWall> Add(VideoWall entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.video_wall (airport_id, terminal_id, airport_sector_id, code, name, grid_rows,
            grid_columns, behavior_group_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @terminal_id, @airport_sector_id, @code, @name, @grid_rows, @grid_columns, @behavior_group_id,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(VideoWall entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.video_wall set airport_id = @airport_id, terminal_id = @terminal_id,
            airport_sector_id = @airport_sector_id, code = @code, name = @name, grid_rows = @grid_rows,
            grid_columns = @grid_columns, behavior_group_id = @behavior_group_id, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
