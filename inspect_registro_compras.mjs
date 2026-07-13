import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = await FileBlob.load("C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx");
const workbook = await SpreadsheetFile.importXlsx(source);
const sheet = workbook.worksheets.getItem("Registro de Compras");
const used = sheet.getUsedRange();
console.log(JSON.stringify({ range: used.address, preview: sheet.getRange("A1:AZ2").values }));
