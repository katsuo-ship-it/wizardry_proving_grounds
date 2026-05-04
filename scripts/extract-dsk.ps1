# scripts/extract-dsk.ps1
# Wraps CiderPress II CLI (cipher.exe) to extract all .TEXT files from a .DSK to a target folder.
#
# Prerequisites:
#   1. Download CiderPress II CLI from https://github.com/fadden/ciderpress2/releases
#   2. Add cipher.exe to PATH (or pass -CipherExe path explicitly)
#
# Usage:
#   .\extract-dsk.ps1 -DskPath C:\path\to\Wiz1A.DSK -OutDir docs\reference\wiz1\pascal-sources\Wiz1A
#   .\extract-dsk.ps1 -DskPath ..\..\Wizardry.Code\Wiz1B.DSK -OutDir docs\reference\wiz1\pascal-sources\Wiz1B -CipherExe C:\tools\ciderpress2\cipher.exe
param(
  [Parameter(Mandatory)] [string]$DskPath,
  [Parameter(Mandatory)] [string]$OutDir,
  [string]$CipherExe = "cipher.exe"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $DskPath)) {
  throw "DSK file not found: $DskPath"
}

# Resolve cipher.exe; allow PATH or explicit path
$cipherCmd = Get-Command $CipherExe -ErrorAction SilentlyContinue
if (-not $cipherCmd) {
  throw "cipher.exe not found. Install CiderPress II and add to PATH, or use -CipherExe to specify path."
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Listing files in $DskPath ..."
$listOutput = & $CipherExe list $DskPath
if ($LASTEXITCODE -ne 0) {
  throw "cipher list failed for $DskPath"
}

# Parse the listing output to find .TEXT files. Output format from CiderPress II:
#   filename       size  type  attrs ...
$textFiles = $listOutput | ForEach-Object {
  $line = $_
  if ($line -match "^\s*([^\s]+\.TEXT)\s+") {
    $matches[1]
  }
}

if (-not $textFiles) {
  Write-Warning "No .TEXT files found in $DskPath. Pascal volume may use a different format. Try -CipherExe with --raw or use AppleCommander."
  return
}

Write-Host "Found $($textFiles.Count) .TEXT files. Extracting to $OutDir ..."

foreach ($name in $textFiles) {
  $dest = Join-Path $OutDir $name
  Write-Host "  -> $name"
  & $CipherExe extract $DskPath $name $dest
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Extract failed for $name (continuing)"
  }
}

Write-Host "Done. Extracted files in $OutDir"
Write-Host "Note: UCSD Pascal source files use CR (0x0D) line endings."
Write-Host "      Use 'Get-Content' or convert with: (Get-Content -Raw $f) -replace ""``r"", ""``n"" | Set-Content $f"
