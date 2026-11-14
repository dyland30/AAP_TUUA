using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DisplayTemplateWidgetDao
{
    private readonly string _cnx;
    public DisplayTemplateWidgetDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DisplayTemplateWidget>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplateWidget>("select * from public.display_template_widget order by display_template_version_id, z_index, id")).ToList();
    }
    public async Task<DisplayTemplateWidget?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DisplayTemplateWidget>("select * from public.display_template_widget where id = @id", new
        {
            id
        });
    }
    public async Task<List<DisplayTemplateWidget>> GetByDisplayTemplateVersionId(Guid displayTemplateVersionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplateWidget>("select * from public.display_template_widget where display_template_version_id = @displayTemplateVersionId order by z_index, id", new
        {
            displayTemplateVersionId
        })).ToList();
    }
    public async Task<DisplayTemplateWidget> Add(DisplayTemplateWidget entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.display_template_widget (display_template_version_id, widget_type_id, pos_x, pos_y,
            width, height, z_index, config, is_visible, created_at, updated_at, created_by, modified_by)
            values (@display_template_version_id, @widget_type_id, @pos_x, @pos_y, @width, @height, @z_index,
            cast(@config as jsonb), @is_visible, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(DisplayTemplateWidget entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.display_template_widget set display_template_version_id = @display_template_version_id,
            widget_type_id = @widget_type_id, pos_x = @pos_x, pos_y = @pos_y, width = @width, height = @height,
            z_index = @z_index, config = cast(@config as jsonb), is_visible = @is_visible,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.display_template_widget where id = @id", new
        {
            id
        });
    }
}
