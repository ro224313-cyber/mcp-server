import fs from "fs";
import OpenAI from "openai";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Read PDF file
const pdfData = new Uint8Array(
  fs.readFileSync("./knowledge/villa-guide.pdf")
);

// Load PDF
const loadingTask = pdfjs.getDocument({ data: pdfData });
const pdf = await loadingTask.promise;

let text = "";

// Extract text
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();

  const strings = content.items.map(item => item.str);
  text += strings.join(" ");
}

// Create embedding
const embedding = await openai.embeddings.create({
 model: "text-embedding-3-small",
  input: text
});

// Save vector
fs.writeFileSync(
  "vector.json",
  JSON.stringify({
    text,
    vector: embedding.data[0].embedding
  })
);

console.log("Embedding created successfully");