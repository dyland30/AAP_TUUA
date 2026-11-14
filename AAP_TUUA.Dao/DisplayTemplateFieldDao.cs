using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DisplayTemplateFieldDao
{
    private readonly string _cnx;
    public DisplayTemplateFieldDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DisplayTemplateField>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplateField>("select * from public.display_template_field order by display_template_version_id, sort_order, id")).ToList();
    }
    public async Task<DisplayTemplateField?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DisplayTemplateField>("select * from public.display_template_field where id = @id", new
        {
            id
        });
    }
    public async Task<List<DisplayTemplateField>> GetByDisplayTemplateVersionId(Guid displayTemplateVersionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplateField>("select * from public.display_template_field where display_template_version_id = @displayTemplateVersionId order by sort_order, id", new
        {
            displayTemplateVersionId
        })).ToList();
    }
    public async Task<DisplayTemplateField> Add(DisplayTemplateField entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.display_template_field (display_template_version_id, field_id, pos_x, pos_y, width, height,
            z_index, font_size, text_align, format_mask, is_bilingual, is_visible, sort_order, properties, created_at, updated_at, created_by, modified_by)
            values (@display_template_version_id, @field_id, @pos_x, @pos_y, @width, @height, @z_index, @font_size, @text_align,
            @format_mask, @is_bilingual, @is_visible, @sort_order, cast(@properties as jsonb), @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(DisplayTemplateField entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.display_template_field set display_template_version_id = @display_template_version_id,
            field_id = @field_id, pos_x = @pos_x, pos_y = @pos_y, width = @width, height = @height, z_index = @z_index,
            font_size = @font_size, text_align = @text_align, format_mask = @format_mask, is_bilingual = @is_bilingual,
            is_visible = @is_visible, sort_order = @sort_order, properties = cast(@properties as jsonb),
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.display_template_field where id = @id", new
        {
            id
        });
    }
}
