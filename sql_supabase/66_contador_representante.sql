-- =============================================================================
-- 66 · Contador y representante legal por empresa (Formulario Virtual 710)
-- =============================================================================
-- El FV 710 (dashboard.html) llena "Datos del Contador" y "Datos del
-- Representante Legal" con estas columnas de empresas_simulador.
-- Datos ficticios para fines académicos (sin comas).
-- Es re-ejecutable.
-- =============================================================================

alter table public.empresas_simulador add column if not exists contador_nombre  text;
alter table public.empresas_simulador add column if not exists contador_dni     text;
alter table public.empresas_simulador add column if not exists contador_cpc     text;
alter table public.empresas_simulador add column if not exists contador_correo  text;
alter table public.empresas_simulador add column if not exists contador_celular text;

update public.empresas_simulador e set
  contador_nombre  = v.nombre,
  contador_dni     = v.dni,
  contador_cpc     = v.cpc,
  contador_correo  = v.correo,
  contador_celular = v.celular
from (values
  ('20123456789', 'Paredes Linares Maria Fernanda',   '40875123', '08-3125', 'contabilidad@empresademo.com.pe',     '958214367'),
  ('20601458722', 'Valdivia Chavez Luis Alberto',     '29874512', '08-1987', 'contabilidad@ferreterasur.com.pe',    '959341728'),
  ('20548912343', 'Tejada Nina Carmen Rosa',          '41236587', '08-3458', 'contabilidad@saborandino.pe',         '951627384'),
  ('20512347895', 'Benavente Quispe Jorge Luis',      '43518762', '08-4012', 'contabilidad@saludtotal.com.pe',      '954872193'),
  ('20487563219', 'Arce Medina Sofia Alejandra',      '44127639', '08-4237', 'contabilidad@alpacaexport.com',       '957318264'),
  ('20455678120', 'Mamani Ccahuana Victor Hugo',      '29641378', '08-2214', 'contabilidad@cargarapida.pe',         '953186472'),
  ('20601987458', 'Gonzales Bedoya Ana Lucia',        '42785316', '08-3876', 'contabilidad@horizonteandino.com.pe', '956743218'),
  ('20530147852', 'Huanca Puma Ruben Dario',          '40319876', '08-3011', 'contabilidad@valleverde.com.pe',      '952468137'),
  ('20602345671', 'Salas Nunez Patricia Veronica',    '43872015', '08-4105', 'estudio@ccasociados.pe',              '958731426'),
  ('20609876540', 'Cutipa Mendoza Hilda Beatriz',     '41598732', '08-3592', 'contabilidad@donpepe.pe',             '951384726'),
  ('20334020184', 'Llerena Vargas Diego Armando',     '45213876', '08-4521', 'contabilidad@losgorriones.com.pe',    '959427318')
) as v(ruc, nombre, dni, cpc, correo, celular)
where e.ruc = v.ruc;

-- Representante legal de LOS GORRIONES S.A. (era la única empresa sin datos)
update public.empresas_simulador
   set representante_legal = 'Torres Zevallos Mario Enrique',
       dni_representante   = '29736415',
       email               = coalesce(email, 'ventas@losgorriones.com.pe')
 where ruc = '20334020184' and representante_legal is null;

-- Verificación
-- select ruc, razon_social, contador_nombre, contador_dni, representante_legal, dni_representante
--   from public.empresas_simulador order by cod_empresa;
