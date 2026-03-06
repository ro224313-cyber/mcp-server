import mammoth from "mammoth";

export async function readDOC() {

  const result = await mammoth.extractRawText({
    path: "./knowledge/ZEA_CRM_Knowledge_Base.docx"
  });

  return result.value;
}