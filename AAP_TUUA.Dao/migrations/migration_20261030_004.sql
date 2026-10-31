alter table flight
    add flight_type_id int references feature(id); -- Feature Group Name: Tipos de Vuelo
