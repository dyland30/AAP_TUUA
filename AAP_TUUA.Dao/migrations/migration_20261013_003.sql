alter table public.document_serial_group
drop column cashier_code;

alter table public.document_sequential_numbers
add column cashier_code varchar(20) references cashier_machine(code);



alter table public.document_serial_group
add location_id uuid null references location(id),
terminal_id uuid null references terminal(id)
