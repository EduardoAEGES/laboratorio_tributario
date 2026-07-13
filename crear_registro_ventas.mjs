import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx";
const outputDir = "C:/Users/Usuario/Desktop/DISTRIBUIR ABRIL/Proyectos 2026/SUNAT_Simuladores/outputs/sunat_registro_ventas";
const outputPath = `${outputDir}/Simulador_SUNAT_EmpresaDemo_registro_ventas.xlsx`;

await fs.mkdir(outputDir, { recursive: true });
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Registro de Ventas");

const dataRange = sheet.getRange("A1:AT366");
sheet.tables.add("A1:AT366", true, "registro_ventas");

const header = dataRange.getRow(0).values[0];
const firstRecord = dataRange.getRow(1).values[0];
const lastRecord = dataRange.getRow(365).values[0];
console.log(JSON.stringify({ headerColumns: header?.length, firstId: firstRecord?.[0], lastId: lastRecord?.[0] }));
console.log(JSON.stringify(dataRange.getRange("A360:AT366").values.map((row) => [row[0], row[1], row[45]])));
if (header.length !== 46 || firstRecord[0] !== 1 || lastRecord[0] !== 364) {
  throw new Error("La tabla registro_ventas no conserva el contenido esperado.");
}

const keyRange = await workbook.inspect({
  kind: "table",
  sheetId: sheet.id,
  range: "A1:AT4",
  include: "values,formulas",
  tableMaxRows: 4,
  tableMaxCols: 46,
  maxChars: 8000,
});
console.log(keyRange.ndjson);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula errors",
});
console.log(formulaErrors.ndjson);

const preview = await workbook.render({
  sheetName: "Registro de Ventas",
  range: "A1:AT20",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/registro_ventas_verificacion.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`SAVED ${outputPath}`);
