import React, { ReactNode } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  renderExpandedRow?: (item: T) => ReactNode;
  expandedRowId?: string | null;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  error,
  emptyTitle = 'No records found',
  emptyDescription = 'There is currently no data to display.',
  onRetry,
  keyExtractor,
  onRowClick,
  renderExpandedRow,
  expandedRowId,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return <LoadingSkeleton rows={5} height="48px" />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const key = keyExtractor(item);
            const isExpanded = expandedRowId === key;
            return (
              <React.Fragment key={key}>
                <tr
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
                {isExpanded && renderExpandedRow && (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: 0, background: 'rgba(0,0,0,0.2)' }}>
                      {renderExpandedRow(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
