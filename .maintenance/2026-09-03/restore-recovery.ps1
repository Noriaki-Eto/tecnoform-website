param(
  [Parameter(Mandatory=$true)][string[]]$Parts,
  [Parameter(Mandatory=$true)][string]$OutputArchive,
  [Parameter(Mandatory=$true)][string]$ExpectedSHA256
)
$ErrorActionPreference = 'Stop'
if ($ExpectedSHA256 -notmatch '^[0-9a-fA-F]{64}$') { throw 'Supply the full SHA-256 from the ledger' }
$orderedParts = @($Parts | ForEach-Object { (Get-Item -LiteralPath $_).FullName })
$output = [System.IO.File]::Open($OutputArchive, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
try {
  foreach ($partPath in $orderedParts) {
    $inputPart = [System.IO.File]::OpenRead($partPath)
    try { $inputPart.CopyTo($output) } finally { $inputPart.Dispose() }
  }
} finally { $output.Dispose() }
$actual = (Get-FileHash -LiteralPath $OutputArchive -Algorithm SHA256).Hash
if ($actual -ne $ExpectedSHA256) { throw 'Restored archive checksum mismatch. Do not use or publish it.' }
[pscustomobject]@{Path=(Get-Item -LiteralPath $OutputArchive).FullName; Bytes=(Get-Item -LiteralPath $OutputArchive).Length; SHA256=$actual; Status='RECOVERED_APPROVAL_PENDING'}
