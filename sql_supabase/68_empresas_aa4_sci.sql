-- =============================================================================
-- 68 · Empresas del AA4 de Sistemas Contables Integrados (8) y sus socios
-- =============================================================================
-- Empresas E13 a E20 tomadas de los enunciados AA4_*_Enunciado.docx (ejercicio
-- 2025). Nombres sin comas (el importador separa por coma).
--
-- OJO: en los enunciados DIGITECH S.A.C. y ARISAND S.A.C. traían el MISMO RUC
-- (20607080900). ARISAND lo conserva y DIGITECH pasa al RUC 20610943722
-- (dígito verificador válido). Hay que corregir el enunciado de DIGITECH.
--
-- socios_empresa: socios que el FV 710 muestra por defecto en
-- "100 Principales socios, asociados y otros" (fv710_socios.js). Lectura
-- pública (anon solo SELECT), como el resto de la data base del simulador.
-- Los DNI de los alumnos son los de la lista del docente; las fechas de
-- nacimiento son ficticias. Grupos: 1 ARISAND,
-- 2 OFIEXPRESS, 3 TOKY, 4 CASA NOVA, 5 LADY OSCAR, 6 MODA TREND, 7 MAYLU;
-- DIGITECH con socios inventados. En cada equipo el GERENTE es el
-- representante legal y el SOCIO Y CONTADOR es el contador (colegiatura
-- inventada); todos figuran como socios.
-- Los alumnos figuran como socios desde el 15/03/2024 (ingresaron después de
-- la constitución); los de DIGITECH desde el inicio de actividades.
--
-- Es re-ejecutable.
-- =============================================================================

begin;

-- 1) Tabla de socios por empresa ------------------------------------------------
create table if not exists public.socios_empresa (
  id                bigserial primary key,
  ruc               text not null,   -- RUC de empresas_simulador
  orden             int  not null default 1,
  tipo_socio        text not null default 'PERSONA NATURAL DOMICILIADA',
  tipo_doc          text not null default 'DOC. NACIONAL DE IDENTIDAD',
  num_doc           text not null,
  nombre            text not null,
  fecha_nacimiento  date,
  pais              text,
  porcentaje        numeric(6,2) not null,
  fecha_socio       date,
  unique (ruc, num_doc)
);
alter table public.socios_empresa enable row level security;
drop policy if exists socios_empresa_lectura on public.socios_empresa;
create policy socios_empresa_lectura on public.socios_empresa for select to anon, authenticated using (true);
revoke all on public.socios_empresa from anon, authenticated;
grant select on public.socios_empresa to anon, authenticated;

-- 2) Empresas -------------------------------------------------------------------
delete from public.socios_empresa where ruc in ('20607080900', '20604128731', '20304050609', '20605512349', '20606623454', '20607734560', '20608845675', '20610943722');
delete from public.empresas_simulador where ruc in ('20607080900', '20604128731', '20304050609', '20605512349', '20606623454', '20607734560', '20608845675', '20610943722');
insert into public.empresas_simulador (
  cod_empresa, ruc, razon_social, nombre_comercial, tipo_sociedad, rubro, que_vende,
  mercado_clientes, ciiu, actividad_economica_sunat, regimen_tributario, regimen_laboral,
  condicion, estado_domicilio, fecha_inicio_actividades, direccion_fiscal, distrito,
  provincia, departamento, telefono, email, web, representante_legal, dni_representante,
  tipo_contabilidad, serie_factura, serie_boleta, serie_nota_credito, emisor_electronico,
  exportador, nro_trabajadores, banco_principal, cuenta_detracciones_bn, obligado_pdt_plame,
  libros_electronicos, sire_presentado_hasta,
  contador_nombre, contador_dni, contador_cpc, contador_correo, contador_celular)
values
  ('E13', '20607080900', 'ARISAND S.A.C.', 'Arisand', 'Sociedad Anonima Cerrada', 'Comercio de equipos de computo software y accesorios tecnologicos', 'Equipos de computo software y accesorios tecnologicos al por mayor y menor', 'Empresas y publico en general', '4651', 'Venta al por mayor de computadoras equipo periferico y programas de informatica', 'Regimen MYPE Tributario', 'Regimen Laboral General', 'Activo', 'Habido', '2020-06-15', 'Av. Ejercito Nro. 710', 'Yanahuara', 'Arequipa', 'Arequipa', '054-290900', 'contacto@arisand.com.pe', null, 'Gutierrez Espiner Ricardo Manuel', '76037759', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'BCP', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Barraza Ramirez Sandra Daniela', '60062002', '04-16231', 'contabilidad@arisand.com.pe', '957080900'),
  ('E14', '20604128731', 'OFIEXPRESS S.A.C.', 'Ofiexpress', 'Sociedad Anonima Cerrada', 'Comercio de articulos de papeleria y utiles de oficina', 'Articulos de papeleria utiles de escritorio y accesorios para oficina', 'Empresas y publico en general', '4761', 'Venta al por menor de libros periodicos y articulos de papeleria', 'Regimen MYPE Tributario', 'Regimen Laboral General', 'Activo', 'Habido', '2019-02-11', 'Calle Mercaderes Nro. 312', 'Arequipa', 'Arequipa', 'Arequipa', '054-248732', 'contacto@ofiexpress.com.pe', null, 'Casillas Humpire Maria Fernanda Katherinne', '60444091', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'Interbank', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Canaza Carrillo Nikole Eugenia', '70983097', '04-16248', 'contabilidad@ofiexpress.com.pe', '954128731'),
  ('E15', '20304050609', 'TOKY S.A.C.', 'Toky Telecom', 'Sociedad Anonima Cerrada', 'Servicios de comunicaciones y venta de equipos de telecomunicaciones', 'Servicios de comunicaciones y equipos de telecomunicaciones', 'Empresas y publico en general', '6190', 'Otras actividades de telecomunicaciones', 'Regimen MYPE Tributario', 'Regimen Laboral General', 'Activo', 'Habido', '2001-09-03', 'Av. Dolores Nro. 145', 'Jose Luis Bustamante y Rivero', 'Arequipa', 'Arequipa', '054-260609', 'contacto@tokytelecom.com.pe', null, 'Ccallo Sacsi Fanny Ruth', '70611749', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'BBVA', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Pacompia Maquera Leydy Lizeth', '73965081', '04-16257', 'contabilidad@tokytelecom.com.pe', '954050609'),
  ('E16', '20605512349', 'CASA NOVA S.A.C.', 'Casa Nova', 'Sociedad Anonima Cerrada', 'Comercio de productos textiles y confecciones', 'Productos textiles y confecciones al por mayor y menor', 'Empresas y publico en general', '4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado', 'Regimen MYPE Tributario', 'Regimen Laboral General', 'Activo', 'Habido', '2019-08-20', 'Calle San Juan de Dios Nro. 405', 'Arequipa', 'Arequipa', 'Arequipa', '054-272354', 'contacto@casanova.com.pe', null, 'Huaman Ayqui Shirley Janeth', '70598978', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'BCP', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Condori Cahuaña Juvinal Davit', '73456876', '04-16263', 'contabilidad@casanova.com.pe', '955512349'),
  ('E17', '20606623454', 'LADY OSCAR S.A.C.', 'Lady Oscar', 'Sociedad Anonima Cerrada', 'Comercio de armas de fuego de uso civil municiones y accesorios (SUCAMEC)', 'Armas de fuego de uso civil municiones y accesorios bajo supervision de SUCAMEC', 'Empresas y publico en general', '4659', 'Venta al por mayor de otros tipos de maquinaria y equipo', 'Regimen General', 'Regimen Laboral General', 'Activo', 'Habido', '2020-01-27', 'Av. Parra Nro. 228', 'Arequipa', 'Arequipa', 'Arequipa', '054-293460', 'contacto@ladyoscar.com.pe', null, 'Hallasi Quispe Mayte Martha', '74221369', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'Scotiabank', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Pari Loayza Karolay Xiomara', '75051232', '04-16279', 'contabilidad@ladyoscar.com.pe', '956623454'),
  ('E18', '20607734560', 'MODA TREND S.A.C.', 'Moda Trend', 'Sociedad Anonima Cerrada', 'Comercio de textiles y confecciones de moda', 'Productos textiles y confecciones de moda al por mayor y menor', 'Empresas y publico en general', '4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado', 'Regimen MYPE Tributario', 'Regimen Laboral General', 'Activo', 'Habido', '2021-03-08', 'Av. Independencia Nro. 1020', 'Arequipa', 'Arequipa', 'Arequipa', '054-224568', 'contacto@modatrend.com.pe', null, 'Pelaez Mamani Cindy Xina', '76202445', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'Interbank', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Lavado Alvarez Yefrim Justo', '61800730', '04-16284', 'contabilidad@modatrend.com.pe', '957734560'),
  ('E19', '20608845675', 'MAYLU S.A.C.', 'Maylu', 'Sociedad Anonima Cerrada', 'Comercio al por menor de textiles y accesorios de moda', 'Productos textiles y accesorios de moda al por menor', 'Empresas y publico en general', '4771', 'Venta al por menor de prendas de vestir calzado y articulos de cuero', 'Regimen MYPE Tributario', 'Regimen Laboral General', 'Activo', 'Habido', '2021-10-04', 'Calle Santo Domingo Nro. 118', 'Arequipa', 'Arequipa', 'Arequipa', '054-245684', 'contacto@maylu.com.pe', null, 'Oscco Paredes Juliana Marcela', '78548248', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'BCP', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Quispe Taya Carla Luz', '61317163', '04-16296', 'contabilidad@maylu.com.pe', '958845675'),
  ('E20', '20610943722', 'DIGITECH S.A.C.', 'Digitech', 'Sociedad Anonima Cerrada', 'Comercio al por mayor de equipos de computo software y accesorios', 'Equipos de computo software y accesorios al por mayor', 'Empresas y publico en general', '4651', 'Venta al por mayor de computadoras equipo periferico y programas de informatica', 'Regimen General', 'Regimen Laboral General', 'Activo', 'Habido', '2022-05-16', 'Av. Javier Prado Este Nro. 2465', 'San Borja', 'Lima', 'Lima', '01-7154820', 'contacto@digitech.com.pe', null, 'Ferrari Montalvo Luciano Andres', '41861532', 'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT', 'NO', 22, 'BBVA', null, 'SI', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Montero Castaneda Gabriela Ines', '47258106', '15-23590', 'contabilidad@digitech.com.pe', '960943722');

-- 3) Socios ---------------------------------------------------------------------
insert into public.socios_empresa (ruc, orden, num_doc, nombre, fecha_nacimiento, porcentaje, fecha_socio)
values
  ('20607080900', 1, '76037759', 'GUTIERREZ ESPINER RICARDO MANUEL', '2002-12-05', 25.00, '2024-03-15'),
  ('20607080900', 2, '60062002', 'BARRAZA RAMIREZ SANDRA DANIELA', '2001-04-02', 25.00, '2024-03-15'),
  ('20607080900', 3, '75585275', 'BELLIDO AROCUTIPA CARMEN ROSA', '2005-11-23', 25.00, '2024-03-15'),
  ('20607080900', 4, '77140844', 'VELARDE HUAMANI JHAVEL ARTURO', '2002-08-18', 25.00, '2024-03-15'),
  ('20604128731', 1, '60444091', 'CASILLAS HUMPIRE MARIA FERNANDA KATHERINNE', '2002-09-25', 25.00, '2024-03-15'),
  ('20604128731', 2, '70983097', 'CANAZA CARRILLO NIKOLE EUGENIA', '2001-10-20', 25.00, '2024-03-15'),
  ('20604128731', 3, '60590719', 'NOA RAMIREZ MILAGROS ANGELICA', '2003-03-01', 25.00, '2024-03-15'),
  ('20604128731', 4, '74585163', 'TINTAYA HUAMANI ROSSMIL BRAYAN', '2002-06-19', 25.00, '2024-03-15'),
  ('20304050609', 1, '70611749', 'CCALLO SACSI FANNY RUTH', '2005-01-13', 20.00, '2024-03-15'),
  ('20304050609', 2, '73965081', 'PACOMPIA MAQUERA LEYDY LIZETH', '2003-08-01', 20.00, '2024-03-15'),
  ('20304050609', 3, '61256762', 'JUAREZ MANUTUPA ELIZABETH JUDITH', '2000-08-18', 20.00, '2024-03-15'),
  ('20304050609', 4, '72399613', 'MEDINA AGUILAR FABRIZIO ALDAYR', '2004-01-14', 20.00, '2024-03-15'),
  ('20304050609', 5, '75880110', 'QUISPE AÑAMURO JHON FERNANDO', '2004-06-11', 20.00, '2024-03-15'),
  ('20605512349', 1, '70598978', 'HUAMAN AYQUI SHIRLEY JANETH', '2003-06-22', 25.00, '2024-03-15'),
  ('20605512349', 2, '73456876', 'CONDORI CAHUAÑA JUVINAL DAVIT', '2005-03-27', 25.00, '2024-03-15'),
  ('20605512349', 3, '75849167', 'HANCCO MAMANI ALEXANDER JONATHAN', '2004-09-06', 25.00, '2024-03-15'),
  ('20605512349', 4, '74822255', 'SAMAYANI FERNANDEZ CESAR HUGO', '2004-01-09', 25.00, '2024-03-15'),
  ('20606623454', 1, '74221369', 'HALLASI QUISPE MAYTE MARTHA', '2002-12-22', 25.00, '2024-03-15'),
  ('20606623454', 2, '75051232', 'PARI LOAYZA KAROLAY XIOMARA', '2005-08-11', 25.00, '2024-03-15'),
  ('20606623454', 3, '60945799', 'HUISA JUCHARO MARIBEL', '2002-08-07', 25.00, '2024-03-15'),
  ('20606623454', 4, '77235369', 'LEANDRES SOLIS FIORELA YENNIFER', '2003-06-14', 25.00, '2024-03-15'),
  ('20607734560', 1, '76202445', 'PELAEZ MAMANI CINDY XINA', '2001-08-25', 25.00, '2024-03-15'),
  ('20607734560', 2, '61800730', 'LAVADO ALVAREZ YEFRIM JUSTO', '2001-06-11', 25.00, '2024-03-15'),
  ('20607734560', 3, '60561868', 'COLQUE SISA SOLEDAD YANET', '2004-04-18', 25.00, '2024-03-15'),
  ('20607734560', 4, '75619392', 'NEYRA CONDO NAYDELY NICOLE', '2001-06-21', 25.00, '2024-03-15'),
  ('20608845675', 1, '78548248', 'OSCCO PAREDES JULIANA MARCELA', '2002-07-14', 25.00, '2024-03-15'),
  ('20608845675', 2, '61317163', 'QUISPE TAYA CARLA LUZ', '2001-08-14', 25.00, '2024-03-15'),
  ('20608845675', 3, '61039434', 'CHINO NINA RAYSA DAMARIS', '2005-08-23', 25.00, '2024-03-15'),
  ('20608845675', 4, '72439533', 'DIAZ LOAYZA ROY OSCAR', '2005-06-15', 25.00, '2024-03-15'),
  ('20610943722', 1, '41861532', 'FERRARI MONTALVO LUCIANO ANDRES', '1982-08-25', 40.00, '2022-05-16'),
  ('20610943722', 2, '41385497', 'BELTRAN OLIVARES VALERIA SOFIA', '1987-11-03', 30.00, '2022-05-16'),
  ('20610943722', 3, '41706813', 'PRADO LINDLEY MATIAS EDUARDO', '1982-04-18', 20.00, '2022-05-16'),
  ('20610943722', 4, '40319972', 'SCHMIDT ARANA CAMILA ISABEL', '1981-02-08', 10.00, '2022-05-16');

commit;

-- 4) Verificación
-- select e.cod_empresa, e.razon_social, e.regimen_tributario, count(s.*) socios, sum(s.porcentaje) pct
--   from empresas_simulador e left join socios_empresa s on s.ruc = e.ruc
--  where e.cod_empresa between 'E13' and 'E20' group by 1, 2, 3 order by 1;
