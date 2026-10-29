param([string]$InputDocx, [string]$OutputPdf)
$ErrorActionPreference = 'Stop'
$wordApp = $null
$wordDoc = $null
try {
  $wordApp = New-Object -ComObject Word.Application
  $wordApp.Visible = $false
  $wordApp.DisplayAlerts = 0
  $wordDoc = $wordApp.Documents.Open($InputDocx, $false, $true)
  $wordDoc.Repaginate()
  $wordDoc.ExportAsFixedFormat($OutputPdf, 17)
  Write-Output ('Pages: ' + $wordDoc.ComputeStatistics(2))
} finally {
  if ($wordDoc) { $wordDoc.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wordDoc) }
  if ($wordApp) { $wordApp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wordApp) }
}
