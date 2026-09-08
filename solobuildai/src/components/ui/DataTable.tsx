import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Input } from './Input';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  idKey?: keyof T;
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  // Sorting
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Search
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  // Actions
  toolbarActions?: React.ReactNode;
  batchActions?: (selectedIds: string[]) => React.ReactNode;
  // Row interaction
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: { label: string; onClick: () => void };
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  idKey = 'id' as keyof T,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  sortKey,
  sortDirection = 'asc',
  onSort,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  toolbarActions,
  batchActions,
  onRowClick,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no records matching your criteria.',
  emptyIcon,
  emptyAction,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every(item => selectedIds.includes(String(item[idKey])));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(data.map(item => String(item[idKey])));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const hasToolbar = onSearchChange !== undefined || toolbarActions !== undefined;

  return (
    <div className="table-container">
      {hasToolbar && (
        <div className="table-toolbar">
          <div className="table-toolbar__left">
            {onSearchChange !== undefined && (
              <div className="table-search-input">
                <Input
                  value={search || ''}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  leftIcon={<Search size={14} />}
                />
              </div>
            )}
          </div>
          {toolbarActions && <div className="table-toolbar__right">{toolbarActions}</div>}
        </div>
      )}

      {/* Batch Actions Bar */}
      {selectable && selectedIds.length > 0 && batchActions && (
        <div className="table-batch-bar">
          <span>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {batchActions(selectedIds)}
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map(col => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={col.sortable ? 'sortable' : ''}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span style={{ display: 'inline-flex', opacity: isSorted ? 1 : 0.4 }}>
                          {isSorted ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const id = String(item[idKey] ?? idx);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id}
                    className={isSelected ? 'row-selected' : ''}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <td style={{ width: '40px', textAlign: 'center' }} onClick={e => handleSelectRow(e, id)}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Select item ${id}`}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                        {col.render ? col.render(item) : item[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="table-footer">
          <span>Showing {data.length} record{data.length === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );
}
