import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export async function readPDF() {

  const pdfData = new Uint8Array(
    fs.readFileSync("./knowledge/villa-guide.pdf")
  );

  const loadingTask = pdfjs.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const strings = content.items.map(item => item.str);
    text += strings.join(" ");
  }

  return text;
}