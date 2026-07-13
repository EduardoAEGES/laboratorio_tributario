import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('compras_fallback.json', 'utf8'));
const headers = rawData[0];
const rows = rawData.slice(1);

function excelDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  // Excel date serial number to YYYY-MM-DD
  return new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000)).toISOString().slice(0, 10);
}

function nullIfBlank(value) { 
  return value == null || value === "" || value === "-" ? null : value; 
}

const mapped = rows.map((row) => {
  const number = Number(row[0]);
  return {
    Periodo: parseInt(String(row[1]).split('/').reverse().join('')), // "01/2025" -> 202501
    "Fecha de emisión": excelDate(row[2]),
    "Fecha Vcto/Pago": excelDate(row[3]),
    "Tipo CP/Doc.": row[4],
    Comprobante: row[5],
    "Serie del CDP": row[6],
    Numero: row[7],
    "Tipo Doc Identidad": nullIfBlank(row[8]),
    "Nro Doc Identidad": nullIfBlank(row[9]),
    "Apellidos y Nombres o Razón social": row[10],
    "Tipo de Proveedor": nullIfBlank(row[27]),
    "BI Gravada (S/)": row[11],
    "Dscto BI (S/)": row[12],
    "IGV/IPM (S/)": row[13],
    "Dscto IGV/IPM (S/)": row[14],
    "Mto Exonerado (S/)": row[15],
    "Mto Inafecto (S/)": row[16],
    "ISC (S/)": row[17],
    "ICBPER (S/)": row[18],
    "Otros Tributos (S/)": row[19],
    "Anticipos (S/)": row[37],
    "Otros Cargos (S/)": row[38],
    "Monto de Redondeo (S/)": row[39],
    "Total CP (S/)": row[20],
    Moneda: row[21],
    "Tipo de Cambio": row[22],
    "Fecha Emision Doc. Modificado": excelDate(row[23]),
    "Tipo CP Modificado": nullIfBlank(row[24]),
    "Serie CP Modificado": nullIfBlank(row[25]),
    "Nro CP Modificado": nullIfBlank(row[26]),
    "Motivo Nota de Credito": nullIfBlank(row[31]),
    "Detalle de la Operación": nullIfBlank(row[28]),
    Descripción: nullIfBlank(row[29]),
    "Forma de Pago": nullIfBlank(row[30]),
    "Sujeto a Detracción / Retención": String(row[32]).trim().toLowerCase() === "si",
    "Tipo (Detracción / Retención Renta 4ta)": nullIfBlank(row[33]),
    "% Aplicado": row[34],
    "Monto Detracción/Retención": row[35],
    "N° Constancia Depósito": nullIfBlank(row[36]),
    src_key: `C${String(number - 1).padStart(5, "0")}`,
  };
});

fs.writeFileSync('mapped_compras.json', JSON.stringify(mapped, null, 2));
console.log("Mapped successfully. Output in mapped_compras.json");
