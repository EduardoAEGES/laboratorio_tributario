import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx";
const outputDir = "C:/Users/Usuario/Desktop/DISTRIBUIR ABRIL/Proyectos 2026/SUNAT_Simuladores/outputs/sunat_registro_ventas";
await fs.mkdir(outputDir, { recursive: true });
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

for (const sheet of workbook.worksheets.items) {
  for (const table of sheet.tables.items) {
    console.log(JSON.stringify({ tableName: table.name, sheet: sheet.name, range: table.getRange().address }));
  }
}
process.exit(0);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 10000,
  tableMaxRows: 8,
  tableMaxCols: 20,
  tableMaxCellChars: 80,
});
console.log(summary.ndjson);

const preview = await workbook.render({
  sheetName: "Registro de Ventas",
  autoCrop: "all",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/registro_ventas_origen.png`, new Uint8Array(await preview.arrayBuffer()));
