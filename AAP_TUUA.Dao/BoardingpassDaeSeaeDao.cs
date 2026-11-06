using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class BoardingpassDaeSeaeDao
{
    private readonly string _cnx;

    public BoardingpassDaeSeaeDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<BoardingpassDaeSeae>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BoardingpassDaeSeae>(
            "select * from public.boardingpass_dae_seae order by flight_date desc, id desc");
        return result.ToList();
    }

    private const string SearchJoins = @"from public.boardingpass_dae_seae as bp
                     left join public.tuua_gate as g on g.code = bp.tuua_gate_code
                     left join public.terminal as t on t.id = g.terminal_id
                     left join public.airport as a on a.id = t.airport_id";

    private const string SearchWhere = @"where bp.created_at >= @dateFrom
                and bp.created_at < @dateToExclusive
                and (@timeFrom::time is null or bp.created_at::time >= @timeFrom::time)
                and (@timeTo::time is null or bp.created_at::time <= @timeTo::time)
                and (@airportId::uuid is null or t.airport_id = @airportId::uuid)
                and (@terminalId::uuid is null or g.terminal_id = @terminalId::uuid)
                and (@flightTypeId::integer is null or bp.flight_type_id = @flightTypeId::integer)
                and (@statusId::integer is null or bp.status_id = @statusId::integer)";

    private const string SearchColumns = @"bp.*,
                         g.terminal_id,
                         t.name as terminal_name,
                         t.airport_id,
                         a.name as airport_name,
                         a.iata_code as airport_iata_code";

    private static object SearchParameters(BoardingpassSearchFilter filter, int limit, int offset) => new
    {
        dateFrom = filter.date_from!.Value.Date,
        dateToExclusive = filter.date_to!.Value.Date.AddDays(1),
        timeFrom = filter.time_from,
        timeTo = filter.time_to,
        airportId = filter.airport_id,
        terminalId = filter.terminal_id,
        flightTypeId = filter.flight_type_id,
        statusId = filter.status_id,
        limit,
        offset
    };

    // Búsqueda paginada en base de datos: un único conteo con los mismos filtros y solo la página solicitada.
    public async Task<PagedResult<BoardingpassSearchItem>> Search(BoardingpassSearchFilter filter)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var offset = (filter.page - 1) * filter.page_size;
        var parameters = SearchParameters(filter, filter.page_size, offset);

        var total = await cnn.ExecuteScalarAsync<int>($"select count(*) {SearchJoins} {SearchWhere}", parameters);
        var items = total == 0 || offset >= total
            ? new List<BoardingpassSearchItem>()
            : (await cnn.QueryAsync<BoardingpassSearchItem>(
                $@"select {SearchColumns}
                  {SearchJoins}
                  {SearchWhere}
                  order by bp.created_at desc, bp.id desc
                  limit @limit offset @offset", parameters)).ToList();

        return new PagedResult<BoardingpassSearchItem>
        {
            items = items,
            total = total,
            page = filter.page,
            page_size = filter.page_size
        };
    }

    // Mismos filtros que Search, sin paginar y con las descripciones de catálogo; se limita a maxRows filas.
    public async Task<List<BoardingpassExportItem>> Export(BoardingpassSearchFilter filter, int maxRows)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BoardingpassExportItem>(
            $@"select {SearchColumns},
                     ft.description as flight_type_description,
                     st.description as status_description,
                     ose.description as ose_status_description,
                     cur.feature_value as currency_code
              {SearchJoins}
                     left join public.feature as ft on ft.id = bp.flight_type_id
                     left join public.feature as st on st.id = bp.status_id
                     left join public.feature as ose on ose.id = bp.ose_status_id
                     left join public.feature as cur on cur.id = bp.currency_id
              {SearchWhere}
              order by bp.created_at desc, bp.id desc
              limit @limit", SearchParameters(filter, maxRows, 0));
        return result.ToList();
    }

    public async Task<BoardingpassDaeSeae?> GetById(long id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BoardingpassDaeSeae>(
            "select * from public.boardingpass_dae_seae where id = @id", new { id });
    }

    public async Task<List<BoardingpassDaeSeae>> GetByFlight(string flightNumber, DateTime flightDate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BoardingpassDaeSeae>(
            @"select * from public.boardingpass_dae_seae
              where flight_number = @flightNumber and flight_date = @flightDate
              order by checkin_sequence_number", new { flightNumber, flightDate });
        return result.ToList();
    }
    
    
    public async Task<List<BoardingpassDaeSeae>?> GetByKey(DateTime flightDate, string flightNumber, string seatNumber, string passengerName, int checkinSequenceNumber)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);

        string query = @"select * from boardingpass_dae_seae
                        where flight_date = @flightDate
                          and flight_number = trim(upper(@flightNumber))
                          and seat_number = trim(upper(@seatNumber))
                          and passenger_name = trim(upper(@passengerName))
                          and checkin_sequence_number = @checkinSequenceNumber
        ";
        
        var result = await cnn.QueryAsync<BoardingpassDaeSeae>(query, 
            new { flightDate, flightNumber,seatNumber,passengerName, checkinSequenceNumber   });
        return result.ToList();
    }
    
    

    public async Task<List<BoardingpassDaeSeae>> GetByDocumentSequentialNumbersId(Guid documentSequentialNumbersId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<BoardingpassDaeSeae>(
            @"select * from public.boardingpass_dae_seae
              where document_sequential_numbers_id = @documentSequentialNumbersId
              order by sequential_number", new { documentSequentialNumbersId });
        return result.ToList();
    }

    public async Task<BoardingpassDaeSeae?> GetBySerialAndSequentialNumber(string serial, long sequentialNumber)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BoardingpassDaeSeae>(
            @"select * from public.boardingpass_dae_seae
              where serial = @serial and sequential_number = @sequentialNumber", new { serial, sequentialNumber });
    }

    // Registra el boardingpass mediante el stored procedure usp_insert_boardingpass_dae_seae.
    // El procedimiento asigna serie, correlativo, precio, moneda, estados y aeropuertos de origen/destino;
    // solo se envían los datos propios del pasajero y del vuelo. No retorna el registro creado.
    public async Task Add(BoardingpassDaeSeae boardingpass)
    {
        using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        // Transacción explícita: si el procedimiento falla se revierte todo (correlativo e insert).
        await using var tx = await cnn.BeginTransactionAsync();
        string query = @"call public.usp_insert_boardingpass_dae_seae(
                             @p_tuua_gate_code::varchar,
                             @p_flight_type_id::integer,
                             @p_airline_id::uuid,
                             @p_flight_number::varchar,
                             @p_flight_date::date,
                             @p_passenger_name::varchar,
                             @p_seat_number::varchar,
                             @p_pnr::varchar,
                             @p_checkin_sequence_number::integer,
                             @p_passenger_status::varchar,
                             @p_str_bcbp::varchar,
                             @p_user::varchar)";
        try
        {
            await cnn.ExecuteAsync(query, new
            {
                p_tuua_gate_code = boardingpass.tuua_gate_code,
                p_flight_type_id = boardingpass.flight_type_id,
                p_airline_id = boardingpass.airline_id,
                p_flight_number = boardingpass.flight_number,
                p_flight_date = boardingpass.flight_date.Date,
                p_passenger_name = boardingpass.passenger_name,
                p_seat_number = boardingpass.seat_number,
                p_pnr = boardingpass.pnr,
                p_checkin_sequence_number = boardingpass.checkin_sequence_number,
                p_passenger_status = boardingpass.passenger_status,
                p_str_bcbp = boardingpass.str_bcbp,
                p_user = boardingpass.created_by
            }, tx);
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task Update(BoardingpassDaeSeae boardingpass)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.boardingpass_dae_seae
                         set document_sequential_numbers_id = @document_sequential_numbers_id,
                             serial = @serial,
                             sequential_number = @sequential_number,
                             tuua_gate_code = @tuua_gate_code,
                             flight_type_id = @flight_type_id,
                             airline_id = @airline_id,
                             price = @price,
                             currency_id = @currency_id,
                             status_id = @status_id,
                             flight_number = @flight_number,
                             flight_date = @flight_date,
                             passenger_name = @passenger_name,
                             seat_number = @seat_number,
                             pnr = @pnr,
                             checkin_sequence_number = @checkin_sequence_number,
                             origin_airport_code = @origin_airport_code,
                             destination_airport_code = @destination_airport_code,
                             passenger_status = @passenger_status,
                             str_bcbp = @str_bcbp,
                             ose_status_id = @ose_status_id,
                             ose_response = @ose_response,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, boardingpass);
    }

   
}
