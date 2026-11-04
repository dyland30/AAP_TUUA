export interface TuuaPayload {
  boardingString: string | null; // Cadena del código de barras o código del ticket TUUA
  operationDate: string | null; // yyyy-MM-dd (DateOnly en el backend)
  tuuaGateCode: string | null;
  flightType: string | null; // N --> Nacional, I --> Internacional
}
