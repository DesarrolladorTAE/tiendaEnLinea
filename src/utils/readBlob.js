export function readBlob(blob, format) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    if (format === "text") reader.readAsText(blob);
    else reader.readAsArrayBuffer(blob);
  });
}

export async function blobHasSignature(blob, signature) {
  if (!(blob instanceof Blob)) return false;
  const bytes = new Uint8Array(await readBlob(blob.slice(0, signature.length)));
  return bytes.length === signature.length && signature.every((value, index) => bytes[index] === value);
}

