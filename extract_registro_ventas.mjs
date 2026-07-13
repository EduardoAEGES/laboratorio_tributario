import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/Usuario/Downloads/Simulador_SUNAT_EmpresaDemo_4.xlsx";
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Registro de Ventas");
console.log(JSON.stringify(sheet.getRange("A1:AT2").values));
