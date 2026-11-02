using AAP_TUUA.Business.BPParser;
using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaAccessControlBL
{
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly TerminalDao _terminalDao;
    private readonly AirportDao _airportDao;
    
    private readonly AirlineDao _airlineDao;
    private readonly FeatureDao _featureDao;
    
    private readonly BoardingpassDaeSeaeBL _boardingpassBL;

    public TuuaAccessControlBL(string cnx)
    {
        _tuuaGateDao = new TuuaGateDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _airportDao = new AirportDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _boardingpassBL = new BoardingpassDaeSeaeBL(cnx);
    }


    public async Task<TuuaResponse> ProcessTuuaAccess(TuuaPayload? payload)
    {
        
        var resp = new TuuaResponse()
        {
            response = "ok",
            color = "green",
            message = "registro satisfactorio"
        };
        
        try
        {
            if (payload == null)
            {
                throw new Exception("payload is null");
            }

            if (string.IsNullOrEmpty(payload.boardingString))
            {
                throw new Exception("No se pudo procesar, la trama está vacía");
            }

            if (payload.operationDate == null)
            {
                throw new Exception("No se pudo procesar, la fecha de operación está vacía");
                
            }
            
            if(string.IsNullOrEmpty(payload.tuuaGateCode))
            {
                throw new Exception("No se pudo procesar, el código de la puerta está vacío");
            }

            if (string.IsNullOrEmpty(payload.flightType))
            {
                throw new Exception("No se pudo procesar, el tipo de vuelo está vacío");
                
            }

            var tuuaGate = await _tuuaGateDao.GetByCode(payload.tuuaGateCode);

            if (tuuaGate == null)
            {
                throw new Exception("No se pudo procesar, la puerta no existe");
                
            }
            
            if(tuuaGate.terminal_id == null)
            {
                throw new Exception("No se pudo procesar, la puerta no tiene terminal asignada");

            }
            
            if(tuuaGate.flight_type_id == null)
            {
                throw new Exception("No se pudo procesar, la puerta no tiene tipo de vuelo asignado");

            }

            var terminal = await _terminalDao.GetById(tuuaGate.terminal_id.Value);
            
            if(terminal == null)
            {
                throw new Exception("No se pudo procesar, la terminal no existe");

            }
            
            if(terminal.airport_id == null)
            {
                throw new Exception("No se pudo procesar, la terminal no tiene aeropuerto asignado");
            }
            
            var airport = await _airportDao.GetById(terminal.airport_id.Value);
            
            if(airport == null)
            {
                throw new Exception("No se pudo procesar, el aeropuerto no existe");
            }
            
            
            //TODO: identificar que tipo de trama es para enviar a procesamiento independiente
            
            //por el momento se procesa solo boardingpass

            try
            {
                var bp = BcbpParser.Parse(payload.boardingString,
                    new BcbpParserOptions { ReferenceDate = payload.operationDate });
                
                var leg = bp.Legs.FirstOrDefault(l => l.FromCityAirportCode.ToUpper().Trim() == airport.iata_code?.ToUpper().Trim());
                if (leg == null)
                {
                    throw new Exception("No se pudo procesar, Aeropuerto Incorrecto");
                }
                
                var airline = await _airlineDao.GetAirlineByCode(bp.IssuerAirlineDesignator);
                if (airline == null)
                {
                    throw new Exception("No se pudo procesar, Aerolínea Incorrecta");
                }
                
                var bpDaeSeae = new BoardingpassDaeSeae();
                
                if (airline.id != null) bpDaeSeae.airline_id = airline.id.Value;
                bpDaeSeae.passenger_name = bp.PassengerName;
                
                bpDaeSeae.seat_number = leg.SeatNumber;
                bpDaeSeae.checkin_sequence_number = leg.CheckInSequenceNumber;
                bpDaeSeae.destination_airport_code = leg.ToCityAirportCode.Trim().ToUpper();
                if (leg.DateOfFlight != null) bpDaeSeae.flight_date = leg.DateOfFlight.Value.ToDateTime(TimeOnly.MinValue);
                bpDaeSeae.flight_number = leg.FlightNumberNormalized;
                bpDaeSeae.origin_airport_code = leg.FromCityAirportCode.Trim().ToUpper();
                bpDaeSeae.flight_type_id = tuuaGate.flight_type_id.Value;
                bpDaeSeae.passenger_status = leg.PassengerStatus.ToString();
                bpDaeSeae.tuua_gate_code = tuuaGate.code??"";
                bpDaeSeae.pnr = leg.OperatingCarrierPnrCode;
                bpDaeSeae.str_bcbp = payload.boardingString;

                bpDaeSeae.created_by = "USRSVC"; //TODO: pasar desde el payload
                bpDaeSeae.modified_by = "USRSVC";

                await _boardingpassBL.Add(bpDaeSeae,"USRSVC");

            }
            catch (Exception ex)
            {
                
                throw new Exception("No se pudo procesar, error en la trama de boardingpass", ex);
            }

            
            
        }
        catch (Exception ex)
        {
            resp = new TuuaResponse()
            {
                response = "error",
                color = "red",
                message = ex.Message
            };
            return resp;
        }

        return resp;
        
    }
    
    
    
}