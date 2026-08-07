# CASOS PRÁCTICOS — SIRE: REEMPLAZO DE PROPUESTA Y AJUSTES POSTERIORES

**Laboratorio:** https://laboratorio-tributario.vercel.app/index.html
**Clave SOL (igual para TODAS las empresas):** Usuario **SIST** · Contraseña **NORTON**
**Puerta 1 (plataforma):** entra primero con tu usuario y contraseña del laboratorio; luego elige la empresa con el RUC + SIST/NORTON.

> Un caso de **REEMPLAZO** y un caso de **AJUSTE POSTERIOR** por cada empresa de la tabla `empresas_simulador`.
> Datos ficticios para fines académicos. IGV = 18%.

## Cómo resolver cada caso en el simulador

**Reemplazo de propuesta** (aplicativo *Abrir aplicativo de Reemplazo*):
1. Elige el modo **RVIE (Ventas)** o **RCE (Compras)** según indique el caso.
2. Coloca **RUC**, **Denominación** y **Periodo** (formato AAAAMM).
3. Agrega una fila por comprobante con: Fecha de emisión, Tipo CP/Doc. (Tabla 3/11), Serie-Número, Tipo y N.° de documento del cliente/proveedor, Base Imponible, IGV, y monto de la nota si corresponde.
4. Del **otro** registro (el que el caso no pide reemplazar): **solo aceptar la propuesta**.

**Ajustes posteriores** (aplicativo *Abrir aplicativo de Ajustes Posteriores*):
- Se aplican sobre un periodo **ya generado**. Se usa para: **anular** un comprobante incluido por error (importes en 0.00, referenciando su CAR SUNAT), **agregar** un comprobante omitido, o registrar una **nota de crédito/débito de un periodo anterior**.

**Códigos útiles (Anexo N.° 1):** `01` Factura · `03` Boleta · `07` Nota de Crédito · `08` Nota de Débito · Tipo doc. identidad: `6` RUC, `1` DNI, `0`/`-` sin documento (exportación a no domiciliado).

---

## 1. EMPRESA DEMO S.A.C. — RUC 20123456789
*Régimen General · Comercio y servicios de cómputo · Exportador · Series F: E001, B: EB01, NC: EB01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605 (Mayo 2026)
La empresa reemplaza la propuesta del **RVIE** de mayo 2026 con:
- **E001-120** (01) — 04/05/2026 — INVERSIONES TICONA S.A.C. (RUC 20604455123). Venta de 8 laptops. Base S/ 12,000.00 + IGV S/ 2,160.00 = **S/ 14,160.00**.
- **EB01-350** (03) — 12/05/2026 — Rodríguez Salas, Ana (DNI 40567890). Accesorios de cómputo. Base S/ 500.00 + IGV S/ 90.00 = **S/ 590.00**.
- **E001-121** (01, **exportación**) — 20/05/2026 — MICROTECH USA INC. (no domiciliado, sin RUC). Exportación de equipos, valor FOB **S/ 7,440.00** (US$ 2,000 × TC 3.72). IGV **S/ 0.00**.
- **EB01-045** (07, **NC del mismo periodo**) — 28/05/2026 — modifica la E001-120 por descuento por pronto pago. Base **S/ -800.00** + IGV **S/ -144.00** = **S/ -944.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202603 (Marzo 2026, ya generado)
En mayo, al conciliar, se detecta que:
- La **E001-090** (emitida 15/03/2026, base S/ 3,000.00 + IGV S/ 540.00) fue incluida en la generación de marzo, pero la operación **se anuló** antes de la entrega. Se registra su **anulación** (importes 0.00) referenciando su CAR SUNAT.
- Se **omitió** la **EB01-300** (03, emitida 27/03/2026, base S/ 500.00 + IGV S/ 90.00 = S/ 590.00), que debe **agregarse** a marzo.

---

## 2. TRANSPORTES CARGA RÁPIDA S.R.L. — RUC 20455678120
*Régimen MYPE Tributario · Transporte de carga (detracción 4%) · No emite boletas · Series F: F001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 con servicios de transporte de carga (**sujetos a detracción 4%**):
- **F001-00000410** (01) — 06/05/2026 — MINERA CERRO VERDE S.A.A. (RUC 20170072465). Flete Arequipa–Matarani. Base S/ 5,000.00 + IGV S/ 900.00 = **S/ 5,900.00**. Detracción 4% = S/ 236.00.
- **F001-00000411** (01) — 15/05/2026 — DISTRIBUIDORA DEL SUR S.A.C. (RUC 20601122446). Ruta Arequipa–Cusco. Base S/ 3,500.00 + IGV S/ 630.00 = **S/ 4,130.00**. Detracción 4% = S/ 165.20.
- **F001-00000412** (01) — 23/05/2026 — AGROINDUSTRIAS MAJES S.A. (RUC 20455112233). Alquiler de camión con conductor. Base S/ 2,000.00 + IGV S/ 360.00 = **S/ 2,360.00**. Detracción 4% = S/ 94.40.
- **FC01-00000030** (07, NC del mismo periodo) — 29/05/2026 — modifica la F001-00000410 por descuento comercial. Base **S/ -300.00** + IGV **S/ -54.00** = **S/ -354.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202604 (Abril 2026, ya generado)
- Se **omitió** declarar la **F001-00000405** (emitida 28/04/2026, base S/ 4,000.00 + IGV S/ 720.00 = S/ 4,720.00) por flete Arequipa–Lima a TRANSALTISA S.A. (RUC 20100073083). Se **agrega** al periodo de abril mediante ajuste posterior.

---

## 3. TEXTILES ALPACA EXPORT S.A.C. — RUC 20487563219
*Régimen General · Manufactura textil y exportación · No emite boletas · Series F: F001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 (combina **venta local gravada**, **exportación** y **maquila**):
- **F001-00000280** (01) — 05/05/2026 — TIENDAS EL CÓNDOR S.A.C. (RUC 20602233114). Venta local de 200 chompas de alpaca. Base S/ 20,000.00 + IGV S/ 3,600.00 = **S/ 23,600.00**.
- **F001-00000281** (01, **exportación**) — 14/05/2026 — ALPACA WORLD LLC (no domiciliado). Exportación de 500 chalinas, valor FOB **S/ 37,200.00** (US$ 10,000 × TC 3.72). IGV **S/ 0.00**.
- **F001-00000282** (01, **servicio de maquila** — sujeto a detracción 10%, fabricación por encargo) — 22/05/2026 — MODA ANDINA S.A.C. (RUC 20604400551). Tejido por encargo. Base S/ 6,000.00 + IGV S/ 1,080.00 = **S/ 7,080.00**. Detracción 10% = S/ 708.00.
- **FC01-00000040** (07, NC del mismo periodo) — 30/05/2026 — modifica la F001-00000280 por devolución de 10 chompas falladas. Base **S/ -1,000.00** + IGV **S/ -180.00** = **S/ -1,180.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202603 (Marzo 2026, ya generado)
- La **FC01-00000035** (07) emitida el 26/03/2026 corresponde a una **nota de crédito por descuento sobre la Factura F001-00000210 emitida en Enero 2026** (periodo anterior), por S/ -1,500.00 de base y S/ -270.00 de IGV. Debe registrarse como ajuste posterior con descuento de base imponible negativo, asociada al periodo anterior.

---

## 4. BOTICA SALUD TOTAL S.A.C. — RUC 20512347895
*Régimen MYPE Tributario · Farmacia (parte de la venta EXONERADA del IGV) · Series F: F001, B: B001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 (mezcla de **gravado** y **exonerado**):
- **B001-0002500** (03) — 03/05/2026 — resumen de boletas del día, ventas al público de medicamentos **gravados**. Base S/ 2,000.00 + IGV S/ 360.00 = **S/ 2,360.00**.
- **B001-0002540** (03, **operación exonerada**) — 03/05/2026 — resumen de boletas por venta de medicamentos oncológicos y para diabetes (Apéndice II, **exonerados**). Monto exonerado **S/ 1,500.00**. IGV **S/ 0.00**.
- **F001-00000180** (01) — 16/05/2026 — CLÍNICA SAN PABLO SUR S.A.C. (RUC 20601778820). Venta de material de curación gravado. Base S/ 3,000.00 + IGV S/ 540.00 = **S/ 3,540.00**.
- **FC01-00000025** (07, NC del mismo periodo) — 28/05/2026 — modifica la F001-00000180 por producto vencido devuelto. Base **S/ -400.00** + IGV **S/ -72.00** = **S/ -472.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202604 (Abril 2026, ya generado)
- La **F001-00000175** (emitida 18/04/2026, base S/ 900.00 + IGV S/ 162.00 = S/ 1,062.00) fue emitida a un cliente equivocado y **anulada** por acuerdo; se registra su **anulación** (importes 0.00) por ajuste posterior referenciando su CAR.

---

## 5. AGROEXPORT VALLE VERDE S.A.C. — RUC 20530147852
*Régimen General · Agroexportación · Ventas locales de productos naturales EXONERADAS (Apéndice I) · Exportador · Series F: F001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 (**exonerado local**, **exportación** y **servicio gravado**):
- **F001-00000150** (01, **exonerada — Apéndice I**) — 05/05/2026 — MERCADO MAYORISTA AREQUIPA S.A. (RUC 20455667788). Venta local de quinua orgánica en estado natural. Monto exonerado **S/ 15,000.00**. IGV **S/ 0.00**.
- **F001-00000151** (01, **exportación**) — 15/05/2026 — GREEN COFFEE IMPORTS INC. (no domiciliado). Exportación de café verde, valor FOB **S/ 55,800.00** (US$ 15,000 × TC 3.72). IGV **S/ 0.00**.
- **F001-00000152** (01, **servicio gravado**) — 22/05/2026 — AGRÍCOLA PAMPA BAJA S.A.C. (RUC 20530998877). Servicio de acopio y secado (maquila). Base S/ 5,000.00 + IGV S/ 900.00 = **S/ 5,900.00**.
- **FC01-00000018** (07, NC del mismo periodo) — 30/05/2026 — modifica la F001-00000150 por merma en pesaje. Base exonerada **S/ -500.00**. IGV **S/ 0.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202603 (Marzo 2026, ya generado)
- Se **omitió** en marzo la **F001-00000140** (01, exportación) emitida el 29/03/2026 a ORGANIC FOODS EUROPE (no domiciliado) por exportación de orégano seco, valor FOB **S/ 22,320.00** (US$ 6,000 × TC 3.72). Se **agrega** al periodo de marzo por ajuste posterior.

---

## 6. RESTAURANTES SABOR ANDINO E.I.R.L. — RUC 20548912343
*Régimen MYPE Tributario · Restaurante y catering · Series F: F001, B: B001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 (predominan **boletas** de consumo y una **factura** de catering):
- **B001-0005000** (03) — 02/05/2026 — resumen de boletas por consumo en salón (menús y carta). Base S/ 2,800.00 + IGV S/ 504.00 = **S/ 3,304.00**.
- **B001-0005080** (03) — 03/05/2026 — resumen de boletas del día. Base S/ 1,800.00 + IGV S/ 324.00 = **S/ 2,124.00**.
- **F001-00000090** (01) — 17/05/2026 — CORPORACIÓN MINERA DEL SUR S.A.C. (RUC 20601445599). Servicio de catering para evento corporativo. Base S/ 6,000.00 + IGV S/ 1,080.00 = **S/ 7,080.00**.
- **FC01-00000012** (07, NC del mismo periodo) — 27/05/2026 — modifica la F001-00000090 por reducción de comensales contratados. Base **S/ -600.00** + IGV **S/ -108.00** = **S/ -708.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202604 (Abril 2026, ya generado)
- Se **omitió** la factura de catering **F001-00000085** (emitida 26/04/2026 a UNIVERSIDAD DEL SUR S.A.C., RUC 20455334411, base S/ 4,500.00 + IGV S/ 810.00 = S/ 5,310.00). Se **agrega** al periodo de abril por ajuste posterior.

---

## 7. COMERCIAL FERRETERA SUR S.A.C. — RUC 20601458722
*Régimen General · Ferretería mayorista/minorista · Series F: F001, B: B001, NC: FC01*

### CASO REEMPLAZO — RCE (Compras) · Periodo 202605
Reemplaza la propuesta del **RCE** (compras) de mayo 2026 con:
- **F002-00001200** (01) — 05/05/2026 — ACEROS AREQUIPA S.A. (RUC 20370146994). Compra de fierro corrugado. Base S/ 15,000.00 + IGV S/ 2,700.00 = **S/ 17,700.00**.
- **E001-00000450** (01) — 12/05/2026 — PINTURAS TEKNO S.A.C. (RUC 20512889977). Compra de pinturas y solventes. Base S/ 4,000.00 + IGV S/ 720.00 = **S/ 4,720.00**.
- **B001-00000560** (03, proveedor **NRUS** — sin crédito fiscal) — 18/05/2026 — Ferretería El Perno de Mario Ríos (RUC 10456778992). Compra menor de accesorios. Total **S/ 180.00**.
- **FC01-00000090** (07, NC del mismo periodo) — 28/05/2026 — el proveedor ACEROS AREQUIPA emite NC por descuento por volumen sobre la F002-00001200. Base **S/ -1,000.00** + IGV **S/ -180.00** = **S/ -1,180.00**.

Respecto del **RVIE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RCE · sobre Periodo 202603 (Marzo 2026, ya generado)
- La factura de compra **F050-00000320** (base S/ 2,500.00 + IGV S/ 450.00) fue incluida en marzo, pero el proveedor la **anuló** y reemitió en abril. Se registra su **anulación** (importes 0.00) en marzo por ajuste posterior, referenciando su CAR.

---

## 8. CONSTRUCTORA HORIZONTE ANDINO S.A.C. — RUC 20601987458
*Régimen General · Construcción (contratos sujetos a detracción 4%) · No emite boletas · Series F: F001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 con **valorizaciones de obra** (detracción 4%) y una **nota de débito por intereses**:
- **F001-00000075** (01) — 08/05/2026 — MUNICIPALIDAD DISTRITAL DE CAYMA (RUC 20154117871). Valorización N.° 3 de obra vial. Base S/ 20,000.00 + IGV S/ 3,600.00 = **S/ 23,600.00**. Detracción 4% = S/ 944.00.
- **F001-00000076** (01) — 20/05/2026 — INMOBILIARIA LOS SAUCES S.A.C. (RUC 20601556677). Valorización de edificio multifamiliar. Base S/ 15,000.00 + IGV S/ 2,700.00 = **S/ 17,700.00**. Detracción 4% = S/ 708.00.
- **F001-00000015** (08, **Nota de Débito** del mismo periodo) — 28/05/2026 — intereses por mora sobre la F001-00000075. Base S/ 500.00 + IGV S/ 90.00 = **S/ 590.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202604 (Abril 2026, ya generado)
- La **FC01-00000010** (07) emitida el 30/04/2026 es una **nota de crédito por anulación de la valorización F001-00000070 emitida en Febrero 2026** (periodo anterior), por observaciones de la supervisión. Base **S/ -10,000.00** + IGV **S/ -1,800.00** = **S/ -11,800.00**. Se registra como ajuste posterior asociado al periodo anterior.

---

## 9. CONSULTORES CONTABLES & ASOCIADOS E.I.R.L. — RUC 20602345671
*Régimen Especial de Renta (RER) · Servicios contables/tributarios (detracción 12%) · No emite boletas · Series F: F001, NC: FC01*

### CASO REEMPLAZO — RVIE (Ventas) · Periodo 202605
Reemplaza la propuesta del **RVIE** de mayo 2026 con **servicios profesionales** (sujetos a **detracción 12% — demás servicios**):
- **F001-00000210** (01) — 05/05/2026 — TRANSPORTES CARGA RÁPIDA S.R.L. (RUC 20455678120). Servicio contable mensual (outsourcing). Base S/ 1,500.00 + IGV S/ 270.00 = **S/ 1,770.00**. Detracción 12% = S/ 212.40.
- **F001-00000211** (01) — 15/05/2026 — BOTICA SALUD TOTAL S.A.C. (RUC 20512347895). Elaboración de DJ Anual y asesoría tributaria. Base S/ 2,500.00 + IGV S/ 450.00 = **S/ 2,950.00**. Detracción 12% = S/ 354.00.
- **F001-00000212** (01) — 24/05/2026 — RESTAURANTES SABOR ANDINO E.I.R.L. (RUC 20548912343). Planillas y PLAME del mes. Base S/ 800.00 + IGV S/ 144.00 = **S/ 944.00**. Detracción 12% = S/ 113.28.
- **FC01-00000008** (07, NC del mismo periodo) — 30/05/2026 — modifica la F001-00000211 por descuento a cliente recurrente. Base **S/ -250.00** + IGV **S/ -45.00** = **S/ -295.00**.

Respecto del **RCE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RVIE · sobre Periodo 202604 (Abril 2026, ya generado)
- Se **omitió** la **F001-00000205** (emitida 29/04/2026 a CONSTRUCTORA HORIZONTE ANDINO S.A.C., RUC 20601987458, por auditoría financiera, base S/ 3,000.00 + IGV S/ 540.00 = S/ 3,540.00). Se **agrega** al periodo de abril por ajuste posterior.

---

## 10. MINIMARKET DON PEPE E.I.R.L. — RUC 20609876540
*Régimen Especial de Renta (RER) · Abarrotes (vende con boleta; bolsas afectas al ICBPER) · Series F: F001, B: B001, NC: FC01*

### CASO REEMPLAZO — RCE (Compras) · Periodo 202605
Reemplaza la propuesta del **RCE** (compras) de mayo 2026 con:
- **F001-00003200** (01) — 04/05/2026 — DISTRIBUIDORA ALICORP S.A.A. (RUC 20100055237). Compra de abarrotes y aceites. Base S/ 5,000.00 + IGV S/ 900.00 = **S/ 5,900.00**.
- **F001-00007800** (01) — 12/05/2026 — EMBOTELLADORA LINDLEY S.A. (RUC 20101024645). Compra de bebidas gaseosas y agua. Base S/ 3,500.00 + IGV S/ 630.00 = **S/ 4,130.00**.
- **B005-00001200** (03, proveedor **NRUS** — sin crédito fiscal) — 18/05/2026 — Panadería Doña Rosa (RUC 10405060702). Compra diaria de pan. Total **S/ 150.00**.
- **FC01-00000200** (07, NC del mismo periodo) — 27/05/2026 — DISTRIBUIDORA ALICORP emite NC por producto próximo a vencer devuelto, sobre la F001-00003200. Base **S/ -300.00** + IGV **S/ -54.00** = **S/ -354.00**.

Respecto del **RVIE**: solo aceptar la propuesta.

### CASO AJUSTE POSTERIOR — RCE · sobre Periodo 202604 (Abril 2026, ya generado)
- Se **omitió** registrar en abril la factura de compra **F001-00006500** (emitida 28/04/2026 por PROVEEDORA DE SNACKS DEL SUR S.A.C., RUC 20601998877, base S/ 1,800.00 + IGV S/ 324.00 = S/ 2,124.00). Se **agrega** al periodo de abril por ajuste posterior para no perder el crédito fiscal.

---

### Resumen de cobertura pedagógica

| # | Empresa | Reemplazo (registro) | Elemento clave | Ajuste posterior |
|---|---------|----------------------|----------------|------------------|
| 1 | Empresa Demo | RVIE | Exportación + NC mismo periodo | Anular + agregar (marzo) |
| 2 | Transportes Carga Rápida | RVIE | Detracción 4% (transporte) | Agregar comprobante omitido |
| 3 | Textiles Alpaca Export | RVIE | Exportación + maquila (detr. 10%) | NC de periodo anterior |
| 4 | Botica Salud Total | RVIE | Venta exonerada (Apéndice II) | Anular comprobante |
| 5 | Agroexport Valle Verde | RVIE | Exonerado (Apéndice I) + exportación | Agregar exportación omitida |
| 6 | Restaurantes Sabor Andino | RVIE | Boletas + factura de catering | Agregar factura omitida |
| 7 | Comercial Ferretera Sur | RCE | Compra + boleta NRUS + NC | Anular compra |
| 8 | Constructora Horizonte Andino | RVIE | Detracción 4% + Nota de Débito | NC de periodo anterior |
| 9 | Consultores Contables | RVIE | Detracción 12% (servicios) | Agregar factura omitida |
| 10 | Minimarket Don Pepe | RCE | Compra + boleta NRUS + NC | Agregar compra omitida |
