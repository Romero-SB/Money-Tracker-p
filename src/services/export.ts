import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

import { MOVEMENT_TYPE_LABELS } from '@/constants/options';
import { movementsRepository, type MovementExportRow } from '@/db/repositories/movements';

const CSV_HEADER = ['Fecha', 'Tipo', 'Cuenta', 'Categoría', 'Descripción', 'Importe'];

function csvEscape(value: string): string {
  if (value === '') {
    return value;
  }
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsv(row: MovementExportRow): string {
  const account =
    row.type === 'transfer' && row.destination_account_name
      ? `${row.account_name} → ${row.destination_account_name}`
      : row.account_name;
  return [
    row.occurred_at.slice(0, 10),
    MOVEMENT_TYPE_LABELS[row.type],
    csvEscape(account),
    csvEscape(row.category_name ?? ''),
    csvEscape(row.description ?? ''),
    row.amount.toFixed(2),
  ].join(',');
}

export async function getExportCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM movements WHERE is_deleted = 0'
  );
  return result?.count ?? 0;
}

export async function exportMovementsCsv(db: SQLiteDatabase): Promise<{ fileName: string; count: number }> {
  const rows = await movementsRepository(db).getAllForExport();
  if (rows.length === 0) {
    throw new Error('No hay movimientos para exportar.');
  }
  const lines = rows.map(rowToCsv);
  const content = `\uFEFF${[CSV_HEADER.join(','), ...lines].join('\r\n')}`;
  const fileName = `movimientos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const file = new File(Paths.cache, fileName);
  file.writeSync(content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar movimientos',
    });
  }
  return { fileName, count: rows.length };
}
