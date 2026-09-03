param(
  [Parameter(Mandatory=$true)][string]$Archive,
  [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$source = Get-Item -LiteralPath $Archive
$destination = Get-Item -LiteralPath $OutputDirectory
if (-not $destination.PSIsContainer) { throw 'Output directory must already exist' }
$partBytes = 32MB
$inputStream = [System.IO.File]::OpenRead($source.FullName)
$buffer = New-Object byte[] (1MB)
try {
  $partNumber = 1
  while ($inputStream.Position -lt $inputStream.Length) {
    $partPath = Join-Path $destination.FullName ($source.Name + '.part' + $partNumber.ToString('00'))
    $outputStream = [System.IO.File]::Open($partPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
    try {
      $written = 0
      while ($written -lt $partBytes -and $inputStream.Position -lt $inputStream.Length) {
        $request = [int][Math]::Min($buffer.Length, $partBytes - $written)
        $count = $inputStream.Read($buffer, 0, $request)
        if ($count -eq 0) { break }
        $outputStream.Write($buffer, 0, $count)
        $written += $count
      }
    } finally { $outputStream.Dispose() }
    [pscustomobject]@{Name=[System.IO.Path]::GetFileName($partPath); Bytes=(Get-Item -LiteralPath $partPath).Length; SHA256=(Get-FileHash -LiteralPath $partPath -Algorithm SHA256).Hash}
    $partNumber += 1
  }
} finally { $inputStream.Dispose() }
