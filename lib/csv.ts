export type CsvRecord = Record<string, string>;

export function parseCsvRecords(content: string, requiredHeaders: string[], label: string, maxRows = 50_000): CsvRecord[] {
  if (content.includes("\0")) throw new Error(`${label} contains unsupported binary data.`);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error(`${label} contains an unfinished quoted field.`);
  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  const [rawHeaders, ...data] = rows;
  const headers = rawHeaders?.map((header, index) => index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim());
  if (!headers || requiredHeaders.some((header) => !headers.includes(header))) throw new Error(`This does not look like ${label}.`);
  if (new Set(headers).size !== headers.length) throw new Error(`${label} contains duplicate column names.`);
  if (data.length > maxRows) throw new Error(`${label} is too large to import at once.`);

  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])));
}
