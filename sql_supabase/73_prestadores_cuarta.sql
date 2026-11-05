-- =============================================================================
-- 73 · Prestadores de cuarta categoría (RUC 10) para emitir Recibos por Honorarios
-- =============================================================================
-- El Recibo por Honorarios Electrónico solo lo emite una persona natural con RUC
-- (10...). Las empresas del simulador son RUC 20, así que se agregan los dos
-- prestadores que aparecen en los cinco casos del EFSRT Módulo 1 (semana 3):
--   P01 CPC Ana María Quispe Flores     10457821634  Asesoría contable
--   P02 Ing. Luis Alberto Torres Mamani 10428765391  Diseño del catálogo digital
-- Con su Clave SOL (RUC + SIST + NORTON) el alumno entra como el prestador y
-- emite el recibo a la empresa de su equipo desde Trámites y consultas >
-- Comprobantes de pago > SEE - SOL > Recibo por Honorarios Electrónicos.
-- "rubro" se usa como la profesión u oficio que imprime el recibo.
-- Es re-ejecutable.
-- =============================================================================

begin;

delete from public.empresas_simulador where ruc in ('10457821634', '10428765391');

insert into public.empresas_simulador (
  cod_empresa, ruc, razon_social, nombre_comercial, tipo_sociedad, rubro, que_vende,
  mercado_clientes, ciiu, actividad_economica_sunat, regimen_tributario, regimen_laboral,
  condicion, estado_domicilio, fecha_inicio_actividades, direccion_fiscal, distrito,
  provincia, departamento, telefono, email, web, representante_legal, dni_representante,
  tipo_contabilidad, serie_factura, serie_boleta, serie_nota_credito, emisor_electronico,
  exportador, nro_trabajadores, banco_principal, cuenta_detracciones_bn, obligado_pdt_plame,
  libros_electronicos, sire_presentado_hasta)
values
  ('P01', '10457821634', 'QUISPE FLORES ANA MARIA', null, 'Persona Natural',
   'CONTADOR PUBLICO (PROFESIONAL)', 'Asesoria contable y tributaria a empresas',
   'Empresas de Arequipa', '6920', 'Actividades de contabilidad teneduria de libros y auditoria',
   'Renta de Cuarta Categoria', null, 'Activo', 'Habido', '2015-04-06',
   'Calle Peral Nro. 215', 'Cercado', 'Arequipa', 'Arequipa', null, 'anaquispe.cpc@gmail.com', null,
   'Quispe Flores Ana Maria', '45782163', null, 'E001', null, 'E001', 'SI - SEE SOL / Recibo por Honorarios',
   'NO', 0, null, null, 'NO', null, null),
  ('P02', '10428765391', 'TORRES MAMANI LUIS ALBERTO', null, 'Persona Natural',
   'INGENIERO DE SISTEMAS (PROFESIONAL)', 'Diseno de catalogos digitales y paginas web',
   'Empresas de Arequipa', '6201', 'Actividades de programacion informatica',
   'Renta de Cuarta Categoria', null, 'Activo', 'Habido', '2012-09-17',
   'Av. Goyeneche Nro. 840', 'Miraflores', 'Arequipa', 'Arequipa', null, 'luistorres.ing@gmail.com', null,
   'Torres Mamani Luis Alberto', '42876539', null, 'E001', null, 'E001', 'SI - SEE SOL / Recibo por Honorarios',
   'NO', 0, null, null, 'NO', null, null);

commit;
