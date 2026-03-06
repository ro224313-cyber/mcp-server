import fs from "fs";
import mammoth from "mammoth";

export async function loadKnowledge() {

  const result = await mammoth.extractRawText({
    path: "./knowledge/ZEA_CRM_Knowledge_Base.docx"
  });

  return result.value; // full document text
}