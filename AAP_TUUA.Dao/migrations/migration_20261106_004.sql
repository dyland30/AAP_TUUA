-- Índices para la consulta paginada de boardingpass registrados (BoardingpassDaeSeaeDao.Search).
-- La consulta filtra por rango de created_at y ordena por created_at desc, id desc.
-- Puede ejecutarse nuevamente: usa if not exists.

-- Rango de fechas de registro + orden de la paginación sin sort adicional.
create index if not exists idx_boardingpass_dae_seae_created_at
    on public.boardingpass_dae_seae (created_at desc, id desc);

-- Filtros por aeropuerto/terminal (se resuelven a puertas TUUA) combinados con el rango de fechas.
create index if not exists idx_boardingpass_dae_seae_gate_created_at
    on public.boardingpass_dae_seae (tuua_gate_code, created_at desc);
