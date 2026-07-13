import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const SUPABASE_URL = "https://klmjmlhwuzhymrplemgw.supabase.co";
const SUPABASE_KEY = "sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b";
const sourcePath = "C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx";
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

function excelDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + Math.round(value * 86400000)).toISOString().slice(0, 10);
}

function nullIfBlank(value) {
  return value == null || value === "" || value === "-" ? null : value;
}

function toBoolean(value) {
  return String(value).trim().toLowerCase() === "si";
}

function toRecord(row) {
  const n = Number(row[0]);
  return {
    periodo: row[1],
    fecha_emision: excelDate(row[2]),
    fecha_vcto_pago: excelDate(row[3]),
    tipo_cp: row[4],
    comprobante: row[5],
    serie: row[6],
    numero: row[7],
    tipo_doc_identidad: nullIfBlank(row[9]),
    nro_doc_identidad: nullIfBlank(row[10]),
    cliente: row[11],
    tipo_cliente: nullIfBlank(row[31]),
    valor_facturado_export: row[12],
    bi_gravada: row[13],
    dscto_bi: row[14],
    igv_ipm: row[15],
    dscto_igv_ipm: row[16],
    mto_exonerado: row[17],
    mto_inafecto: row[18],
    isc: row[19],
    bi_grav_ivap: row[20],
    ivap: row[21],
    icbper: row[22],
    otros_tributos: row[23],
    anticipos: row[41],
    otros_cargos: row[42],
    monto_redondeo: row[43],
    total_cp: row[24],
    moneda: row[25],
    tipo_cambio: row[26],
    doc_mod_fecha_emision: excelDate(row[27]),
    doc_mod_tipo_cp: nullIfBlank(row[28]),
    doc_mod_serie: nullIfBlank(row[29]),
    doc_mod_numero: nullIfBlank(row[30]),
    motivo_nota_credito: nullIfBlank(row[36]),
    detalle_operacion: nullIfBlank(row[32]),
    descripcion: nullIfBlank(row[33]),
    forma_pago: nullIfBlank(row[34]),
    nro_cuotas: nullIfBlank(row[35]),
    sujeto_detraccion: toBoolean(row[37]),
    pct_detraccion: row[38],
    monto_detraccion: row[39],
    nro_constancia_detrac: nullIfBlank(row[40]),
    src_key: `V${String(n - 1).padStart(5, "0")}`,
  };
}

const source = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(source);
const rows = workbook.worksheets.getItem("Registro de Ventas").getRange("A2:AT365").values;
const records = rows.map(toRecord);

const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/registro_ventas?select=src_key&limit=10000`, { headers });
if (!existingResponse.ok) throw new Error(`No se pudo consultar la tabla: ${existingResponse.status} ${await existingResponse.text()}`);
const existingKeys = new Set((await existingResponse.json()).map((row) => row.src_key));
const pending = records.filter((record) => !existingKeys.has(record.src_key));

if (pending.length === 0) {
  console.log(JSON.stringify({ sourceRecords: records.length, existingRecords: existingKeys.size, inserted: 0, message: "No hay registros pendientes." }));
  process.exit(0);
}

const batchSize = 50;
for (let start = 0; start < pending.length; start += batchSize) {
  const batch = pending.slice(start, start + batchSize);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/registro_ventas`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(batch),
  });
  if (!response.ok) throw new Error(`Falló el lote ${start / batchSize + 1}: ${response.status} ${await response.text()}`);
  const created = await response.json();
  if (created.length !== batch.length) throw new Error(`El lote ${start / batchSize + 1} devolvió ${created.length} filas, se esperaban ${batch.length}.`);
  console.log(JSON.stringify({ batch: start / batchSize + 1, inserted: created.length, firstKey: batch[0].src_key, lastKey: batch.at(-1).src_key }));
}

const verification = await fetch(`${SUPABASE_URL}/rest/v1/registro_ventas?select=src_key&limit=10000`, { headers: { ...headers, Prefer: "count=exact" } });
if (!verification.ok) throw new Error(`No se pudo verificar la carga: ${verification.status} ${await verification.text()}`);
const finalKeys = new Set((await verification.json()).map((row) => row.src_key));
const missing = records.map((record) => record.src_key).filter((key) => !finalKeys.has(key));
console.log(JSON.stringify({ sourceRecords: records.length, inserted: pending.length, finalRecords: finalKeys.size, missingSourceRecords: missing.length }));
if (missing.length) throw new Error(`La verificación encontró registros faltantes: ${missing.slice(0, 10).join(", ")}`);
