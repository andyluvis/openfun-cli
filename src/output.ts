export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function outputTable(
  rows: Record<string, unknown>[],
  columns?: string[]
): void {
  if (rows.length === 0) {
    console.log("(no results)");
    return;
  }

  const cols = columns || Object.keys(rows[0]);
  const widths: Record<string, number> = {};

  for (const col of cols) {
    widths[col] = col.length;
    for (const row of rows) {
      const val = String(row[col] ?? "");
      widths[col] = Math.max(widths[col], val.length);
    }
    widths[col] = Math.min(widths[col], 50); // cap column width
  }

  // Header
  const header = cols.map((c) => c.padEnd(widths[c])).join("  ");
  const separator = cols.map((c) => "─".repeat(widths[c])).join("──");
  console.log(header);
  console.log(separator);

  // Rows
  for (const row of rows) {
    const line = cols
      .map((c) => String(row[c] ?? "").slice(0, 50).padEnd(widths[c]))
      .join("  ");
    console.log(line);
  }
}

export function outputError(message: string): void {
  console.error(`Error: ${message}`);
}

export function outputSuccess(message: string): void {
  console.error(`✓ ${message}`);
}
