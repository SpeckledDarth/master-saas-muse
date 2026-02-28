type CsvValue = string | number | boolean | null | undefined

interface CsvExportOptions {
  filename: string
  headers: string[]
  rows: CsvValue[][]
}

function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCsv({ filename, headers, rows }: CsvExportOptions): void {
  const headerLine = headers.map(escapeCsvField).join(',')
  const dataLines = rows.map(row => row.map(escapeCsvField).join(','))
  const csvContent = [headerLine, ...dataLines].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
