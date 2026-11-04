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
    private readonly FlightDao _flightDao;
    
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
        _flightDao = new FlightDao(cnx);    
        _boardingpassBL = new BoardingpassDaeSeaeBL(cnx);
    }


    public async Task ProcessTuuaAccess(TuuaPayload? payload, string? userId)
    {
        
            if (payload == null)
            {
                throw new Exception("payload is null");
            }

            if (string.IsNullOrEmpty(payload.boardingString))
            {
                throw new Exception("la trama está vacía");
            }

            if (payload.operationDate == null)
            {
                throw new Exception("la fecha de operación está vacía");
                
            }
            
            if(string.IsNullOrEmpty(payload.tuuaGateCode))
            {
                throw new Exception("el código de la puerta está vacío");
            }

            if (string.IsNullOrEmpty(payload.flightType))
            {
                throw new Exception("el tipo de vuelo está vacío");
                
            }

            var tuuaGate = await _tuuaGateDao.GetByCode(payload.tuuaGateCode);

            if (tuuaGate == null)
            {
                throw new Exception("la puerta no existe");
                
            }
            
            if(tuuaGate.terminal_id == null)
            {
                throw new Exception("la puerta no tiene terminal asignada");

            }
            
            if(tuuaGate.flight_type_id == null)
            {
                throw new Exception("la puerta no tiene tipo de vuelo asignado");

            }

            var terminal = await _terminalDao.GetById(tuuaGate.terminal_id.Value);
            
            if(terminal == null)
            {
                throw new Exception("la terminal no existe");

            }
            
            if(terminal.airport_id == null)
            {
                throw new Exception("la terminal no tiene aeropuerto asignado");
            }
            
            var airport = await _airportDao.GetById(terminal.airport_id.Value);
            
            if(airport == null)
            {
                throw new Exception("el aeropuerto no existe");
            }
            
            
            //TODO: identificar que tipo de trama es para enviar a procesamiento independiente
            
            //por el momento se procesa solo boardingpass
            
            var bp = BcbpParser.Parse(payload.boardingString,
                new BcbpParserOptions { ReferenceDate = payload.operationDate });
                
            var leg = bp.Legs.FirstOrDefault(l => l.FromCityAirportCode.ToUpper().Trim() == airport.iata_code?.ToUpper().Trim());
            if (leg == null)
            {
                throw new Exception("Aeropuerto Incorrecto");
            }
                
            var airline = await _airlineDao.GetAirlineByCode(leg.OperatingCarrierDesignator);
            if (airline == null)
            {
                throw new Exception("Aerolínea Incorrecta");
            }

            
            string flightNumber = $"{leg.OperatingCarrierDesignator}{leg.FlightNumberNormalized}";

            if (leg.DateOfFlight == null)
            {
                throw new Exception("Fecha de vuelo Incorrecta");
                
            }
            
            
            var flight = await _flightDao.GetByFlightIdentity(flightNumber, leg.DateOfFlight.Value.ToDateTime(TimeOnly.MinValue));
            if (flight == null)
            {
                throw new Exception("Vuelo No Programado");
            }
            
            var bpOld = await _boardingpassBL.GetByKey(leg.DateOfFlight.Value.ToDateTime(TimeOnly.MinValue), flightNumber, leg.SeatNumber,
                bp.PassengerName, leg.CheckInSequenceNumber??0);

            if (bpOld != null && bpOld.Any())
            {
                throw new Exception("Boardingpass ya registrado");
            }
            
            try
            {
                var bpDaeSeae = new BoardingpassDaeSeae();
                
                if (airline.id != null) bpDaeSeae.airline_id = airline.id.Value;
                bpDaeSeae.passenger_name = bp.PassengerName;
                
                bpDaeSeae.seat_number = leg.SeatNumber;
                bpDaeSeae.checkin_sequence_number = leg.CheckInSequenceNumber;
                bpDaeSeae.destination_airport_code = leg.ToCityAirportCode.Trim().ToUpper();
                if (leg.DateOfFlight != null) bpDaeSeae.flight_date = leg.DateOfFlight.Value.ToDateTime(TimeOnly.MinValue);
                bpDaeSeae.flight_number = flightNumber;
                bpDaeSeae.origin_airport_code = leg.FromCityAirportCode.Trim().ToUpper();
                bpDaeSeae.flight_type_id = tuuaGate.flight_type_id.Value;
                bpDaeSeae.passenger_status = leg.PassengerStatus.ToString();
                bpDaeSeae.tuua_gate_code = tuuaGate.code??"";
                bpDaeSeae.pnr = leg.OperatingCarrierPnrCode;
                bpDaeSeae.str_bcbp = payload.boardingString;

                bpDaeSeae.created_by = userId; 
                bpDaeSeae.modified_by = userId;

                await _boardingpassBL.Add(bpDaeSeae,userId);

            }
            catch (Exception ex)
            {
                
                throw new Exception($"error en la trama de boardingpass {ex.Message}", ex);
            }
        
    }
    
    
    
}