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

    public async Task<BoardingpassDaeSeae> Add(BoardingpassDaeSeae boardingpass)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.boardingpass_dae_seae (document_sequential_numbers_id, serial,
                             sequential_number, tuua_gate_code, flight_type_id, airline_id, price, currency_id,
                             status_id, flight_number, flight_date, passenger_name, seat_number, pnr,
                             checkin_sequence_number, origin_airport_code, destination_airport_code,
                             passenger_status, str_bcbp, ose_status_id, ose_response,
                             created_at, updated_at, created_by, modified_by)
                         values (@document_sequential_numbers_id, @serial,
                             @sequential_number, @tuua_gate_code, @flight_type_id, @airline_id, @price, @currency_id,
                             @status_id, @flight_number, @flight_date, @passenger_name, @seat_number, @pnr,
                             @checkin_sequence_number, @origin_airport_code, @destination_airport_code,
                             @passenger_status, @str_bcbp, @ose_status_id, @ose_response,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        boardingpass.id = await cnn.QueryFirstOrDefaultAsync<long>(query, boardingpass);
        return boardingpass;
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
