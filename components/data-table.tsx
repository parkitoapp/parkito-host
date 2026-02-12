/**
 * Componente per la tabella dei dati
 * Mostra una tabella con i dati passati come props
 * - Columns per le colonne della tabella
 * - Data per i dati della tabella
 * - OnRowClick per la funzione da eseguire al click di una riga
 * @param columns - Le colonne della tabella
 * @param data - I dati della tabella
 * @param onRowClick - La funzione da eseguire al click di una riga
 * @returns Un componente React che mostra la tabella
 */

"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  type SortingState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { ArrowDown, ArrowUp } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-col w-full h-full items-center justify-between">
      {/* <div className="flex items-center justify-end w-full mb-4">
        <Button className="flex items-end gap-2">
          <IconFilter className="size-4" />
          Filtra
        </Button>
      </div> */}
      <div className="border rounded-md overflow-hidden flex-1 w-full">
        <Table>
          <TableHeader className="bg-accent/10 dark:bg-accent/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        canSort && "cursor-pointer select-none",
                        "align-middle py-4 text-foreground"
                      )}
                      onClick={
                        canSort ? header.column.getToggleSortingHandler() : undefined
                      }
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        {canSort && (
                          <span className="text-foreground shrink-0">
                            {sorted === "asc" ? <ArrowUp className="size-4 text-foreground" /> : <ArrowDown className="size-4 text-foreground" />}
                          </span>
                        )}
                      </span>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    "hover:bg-muted/40"
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="font-medium"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-sm text-muted-foreground text-center"
                >
                  Nessuna prenotazione trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </div>
      <div className="flex items-end justify-end w-full space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          aria-label="Precedente"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <IconChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Successivo"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <IconChevronRight />
        </Button>
      </div>
    </div>
  )
}

