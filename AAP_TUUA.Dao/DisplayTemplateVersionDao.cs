using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DisplayTemplateVersionDao
{
    private readonly string _cnx;
    public DisplayTemplateVersionDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DisplayTemplateVersion>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplateVersion>("select * from public.display_template_version order by display_template_id, version_number desc")).ToList();
    }
    public async Task<DisplayTemplateVersion?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DisplayTemplateVersion>("select * from public.display_template_version where id = @id", new
        {
            id
        });
    }
    public async Task<List<DisplayTemplateVersion>> GetByDisplayTemplateId(Guid displayTemplateId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplateVersion>("select * from public.display_template_version where display_template_id = @displayTemplateId order by version_number desc", new
        {
            displayTemplateId
        })).ToList();
    }
    public async Task<DisplayTemplateVersion> Add(DisplayTemplateVersion entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.display_template_version (display_template_id, version_number, layout, styles,
            background_media_asset_id, is_published, published_at, published_by, change_notes, created_at, updated_at, created_by, modified_by)
            values (@display_template_id, @version_number, cast(@layout as jsonb), cast(@styles as jsonb), @background_media_asset_id,
            @is_published, @published_at, @published_by, @change_notes, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(DisplayTemplateVersion entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.display_template_version set display_template_id = @display_template_id, version_number = @version_number,
            layout = cast(@layout as jsonb), styles = cast(@styles as jsonb), background_media_asset_id = @background_media_asset_id,
            is_published = @is_published, published_at = @published_at, published_by = @published_by, change_notes = @change_notes,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.display_template_version where id = @id", new
        {
            id
        });
    }
}
