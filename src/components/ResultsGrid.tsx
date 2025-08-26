import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTime?: number;
  rowCount?: number;
}

interface ResultsGridProps {
  result: QueryResult | null;
  loading?: boolean;
  error?: string;
}

export function ResultsGrid({ result, loading, error }: ResultsGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Executing query...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 rounded text-destructive text-sm">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No query executed
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Results Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {result.rowCount || result.rows.length} rows
          </Badge>
          {result.executionTime && (
            <Badge variant="outline" className="text-xs">
              {result.executionTime}ms
            </Badge>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              {result.columns.map((column, index) => (
                <TableHead key={index} className="text-xs font-medium border-r border-border last:border-r-0">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-accent/50">
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="text-xs border-r border-border last:border-r-0 font-mono">
                    {cell === null ? (
                      <span className="text-muted-foreground italic">NULL</span>
                    ) : (
                      String(cell)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}