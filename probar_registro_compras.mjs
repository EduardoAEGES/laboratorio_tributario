import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const url = "https://klmjmlhwuzhymrplemgw.supabase.co/rest/v1/registro_compras";
const key = "sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b";
const source = await FileBlob.load("C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx");
const workbook = await SpreadsheetFile.importXlsx(source);
const row = workbook.worksheets.getItem("Registro de Compras").getRange("A3:AO3").values[0];

function date(value) {
  if (value == null || value === "") return null;
  return new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000)).toISOString().slice(0, 10);
}
function nullable(value) { return value == null || value === "" || value === "-" ? null : value; }

const record = {
  periodo: row[1], fecha_emision: date(row[2]), fecha_vcto_pago: date(row[3]), tipo_cp: row[4], comprobante: row[5], serie: row[6], numero: row[7],
  tipo_doc_identidad: nullable(row[8]), nro_doc_identidad: nullable(row[9]), proveedor: row[10],
  bi_gravada: row[11], dscto_bi: row[12], igv_ipm: row[13], dscto_igv_ipm: row[14], mto_exonerado: row[15], mto_inafecto: row[16], isc: row[17], icbper: row[18], otros_tributos: row[19], total_cp: row[20], moneda: row[21], tipo_cambio: row[22],
  doc_mod_fecha_emision: date(row[23]), doc_mod_tipo_cp: nullable(row[24]), doc_mod_serie: nullable(row[25]), doc_mod_numero: nullable(row[26]), tipo_proveedor: nullable(row[27]), detalle_operacion: nullable(row[28]), descripcion: nullable(row[29]), forma_pago: nullable(row[30]), motivo_nota_credito: nullable(row[31]),
  anticipos: row[37], otros_cargos: row[38], monto_redondeo: row[39], src_key: "C00000"
};

const response = await fetch(url, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "tx=rollback,return=representation" },
  body: JSON.stringify([record]),
});
console.log(JSON.stringify({ status: response.status, preferenceApplied: response.headers.get("preference-applied"), body: await response.text() }));
