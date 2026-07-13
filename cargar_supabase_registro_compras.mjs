import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const SUPABASE_URL = "https://klmjmlhwuzhymrplemgw.supabase.co";
const SUPABASE_KEY = "sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b";
const sourcePath = "C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx";
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

function excelDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  return new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000)).toISOString().slice(0, 10);
}
function nullIfBlank(value) { return value == null || value === "" || value === "-" ? null : value; }
function toRecord(row) {
  const number = Number(row[0]);
  return {
    periodo: row[1], fecha_emision: excelDate(row[2]), fecha_vcto_pago: excelDate(row[3]), tipo_cp: row[4], comprobante: row[5], serie: row[6], numero: row[7],
    tipo_doc_identidad: nullIfBlank(row[8]), nro_doc_identidad: nullIfBlank(row[9]), proveedor: row[10], tipo_proveedor: nullIfBlank(row[27]),
    bi_gravada: row[11], dscto_bi: row[12], igv_ipm: row[13], dscto_igv_ipm: row[14], mto_exonerado: row[15], mto_inafecto: row[16], isc: row[17], icbper: row[18], otros_tributos: row[19],
    anticipos: row[37], otros_cargos: row[38], monto_redondeo: row[39], total_cp: row[20], moneda: row[21], tipo_cambio: row[22],
    doc_mod_fecha_emision: excelDate(row[23]), doc_mod_tipo_cp: nullIfBlank(row[24]), doc_mod_serie: nullIfBlank(row[25]), doc_mod_numero: nullIfBlank(row[26]),
    motivo_nota_credito: nullIfBlank(row[31]), detalle_operacion: nullIfBlank(row[28]), descripcion: nullIfBlank(row[29]), forma_pago: nullIfBlank(row[30]),
    sujeto_detrac_retenc: String(row[32]).trim().toLowerCase() === "si", tipo_carga: nullIfBlank(row[33]), pct_aplicado: row[34], monto_detrac_retenc: row[35], nro_constancia_deposito: nullIfBlank(row[36]),
    src_key: `C${String(number - 1).padStart(5, "0")}`,
  };
}

const source = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(source);
const rows = workbook.worksheets.getItem("Registro de Compras").getRange("A2:AO435").values;
const records = rows.map(toRecord);

const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/registro_compras?select=src_key&limit=10000`, { headers });
if (!existingResponse.ok) throw new Error(`No se pudo consultar la tabla: ${existingResponse.status} ${await existingResponse.text()}`);
const existingKeys = new Set((await existingResponse.json()).map((row) => row.src_key));
const pending = records.filter((record) => !existingKeys.has(record.src_key));

const batchSize = 50;
for (let start = 0; start < pending.length; start += batchSize) {
  const batch = pending.slice(start, start + batchSize);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/registro_compras`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(batch),
  });
  if (!response.ok) throw new Error(`Falló el lote ${start / batchSize + 1}: ${response.status} ${await response.text()}`);
  const created = await response.json();
  if (created.length !== batch.length) throw new Error(`El lote ${start / batchSize + 1} devolvió ${created.length} filas, se esperaban ${batch.length}.`);
  console.log(JSON.stringify({ batch: start / batchSize + 1, inserted: created.length, firstKey: batch[0].src_key, lastKey: batch.at(-1).src_key }));
}

const verification = await fetch(`${SUPABASE_URL}/rest/v1/registro_compras?select=src_key&limit=10000`, { headers });
if (!verification.ok) throw new Error(`No se pudo verificar la carga: ${verification.status} ${await verification.text()}`);
const finalKeys = new Set((await verification.json()).map((row) => row.src_key));
const missing = records.map((record) => record.src_key).filter((key) => !finalKeys.has(key));
console.log(JSON.stringify({ sourceRecords: records.length, inserted: pending.length, finalRecords: finalKeys.size, missingSourceRecords: missing.length }));
if (missing.length) throw new Error(`La verificación encontró registros faltantes: ${missing.slice(0, 10).join(", ")}`);
