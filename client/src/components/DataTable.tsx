import { type ReactNode } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

type Props<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  emptyTitle: string;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T, actions: ReactNode) => ReactNode;
};

export function DataTable<T>({ rows, columns, emptyTitle, onRowClick, renderMobileCard }: Props<T>) {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-black text-slate-900 dark:text-white">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-slate-500">Create a record or adjust filters to see data here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mobile-card-list">
        {table.getRowModel().rows.map((row) => {
          const cells = row.getVisibleCells();
          const primaryCell = cells[0];
          const actionCell = cells[cells.length - 1];
          const detailCells = cells.slice(1, -1).slice(0, 4);
          const actions = (
            <div className="mobile-data-actions">
              {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
            </div>
          );

          if (renderMobileCard) {
            return (
              <div key={row.id}>
                {renderMobileCard(row.original, actions)}
              </div>
            );
          }

          return (
            <article
              key={row.id}
              className="mobile-data-card"
              onClick={() => onRowClick?.(row.original)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              <div className="mobile-data-card-head">
                <div>
                  <span className="mobile-data-kicker">Record</span>
                  <strong>{flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}</strong>
                </div>
                {actions}
              </div>
              <div className="mobile-data-grid">
                {detailCells.map((cell) => (
                  <div key={cell.id} className="mobile-data-field">
                    <span>{String(cell.column.columnDef.header || '').replace(/([A-Z])/g, ' $1')}</span>
                    <strong>{flexRender(cell.column.columnDef.cell, cell.getContext())}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <div className="desktop-table-wrap overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-cyan-50/80 dark:border-slate-800 dark:bg-slate-800">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`${onRowClick ? 'cursor-pointer' : 'cursor-default'} transition hover:bg-cyan-50/60 dark:hover:bg-slate-800/70`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="max-w-[320px] truncate px-4 py-3.5 align-top text-slate-700 dark:text-slate-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
