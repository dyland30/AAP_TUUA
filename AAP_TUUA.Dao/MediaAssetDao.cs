using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class MediaAssetDao
{
    private readonly string _cnx;
    public MediaAssetDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<MediaAsset>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<MediaAsset>("select * from public.media_asset order by name, id")).ToList();
    }
    public async Task<MediaAsset?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<MediaAsset>("select * from public.media_asset where id = @id", new
        {
            id
        });
    }
    public async Task<List<MediaAsset>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<MediaAsset>("select * from public.media_asset where airport_id = @airportId order by name, id", new
        {
            airportId
        })).ToList();
    }
    public async Task<MediaAsset> Add(MediaAsset entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.media_asset (airport_id, media_type_id, name, storage_path, text_content, mime_type,
            file_size_bytes, width_px, height_px, duration_seconds, checksum_sha256, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @media_type_id, @name, @storage_path, @text_content, @mime_type, @file_size_bytes, @width_px,
            @height_px, @duration_seconds, @checksum_sha256, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(MediaAsset entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.media_asset set airport_id = @airport_id, media_type_id = @media_type_id, name = @name,
            storage_path = @storage_path, text_content = @text_content, mime_type = @mime_type, file_size_bytes = @file_size_bytes,
            width_px = @width_px, height_px = @height_px, duration_seconds = @duration_seconds, checksum_sha256 = @checksum_sha256,
            is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
