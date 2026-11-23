// Read quoted CSV records, including escaped quotes and multiline descriptions.
export function summarizeProductCsv(text, namePattern = /^(name|nombre|descripcion|producto|nombre del producto|descripcion del producto)$/i) {
  const source = text.replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0];
  const delimiter = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  let quoted = false;
  let field = "";
  let row = [];
  let headers;
  let nameIndex = -1;
  let total = 0;
  const names = [];
  const finishRow = () => {
    row.push(field.trim());
    field = "";
    if (row.some(Boolean)) {
      if (!headers) {
        headers = row;
        nameIndex = headers.findIndex((value) => namePattern.test(value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
      } else {
        total += 1;
        if (nameIndex >= 0 && row[nameIndex] && names.length < 50) names.push(row[nameIndex]);
      }
    }
    row = [];
  };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim()); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      finishRow();
      if (char === "\r" && source[index + 1] === "\n") index += 1;
    } else field += char;
  }
  if (quoted) return null;
  if (field || row.length) finishRow();
  // Only report product counts when a recognizable product header exists.
  return nameIndex >= 0 ? { total, names } : null;
}
