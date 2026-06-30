/** Compare line rows against a reference snapshot for inline save bars (AB-0041). */

export function countDirtyRows<TRow extends { id: string }>(current: TRow[], reference: TRow[]): number {
  const referenceById = new Map(reference.map((row) => [row.id, row]));
  const currentIds = new Set(current.map((row) => row.id));
  let count = 0;

  for (const row of current) {
    const baseline = referenceById.get(row.id);
    if (!baseline || !rowsEqual(row, baseline)) count += 1;
  }

  for (const row of reference) {
    if (!currentIds.has(row.id)) count += 1;
  }

  return count;
}

export function isDirtyCollection<TRow extends { id: string }>(current: TRow[], reference: TRow[]): boolean {
  return countDirtyRows(current, reference) > 0;
}

export function isRowDirty<TRow extends { id: string }>(row: TRow, reference: TRow[]): boolean {
  const baseline = reference.find((item) => item.id === row.id);
  if (!baseline) return true;
  return !rowsEqual(row, baseline);
}

function rowsEqual<TRow extends { id: string }>(a: TRow, b: TRow): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
