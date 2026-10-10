$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.manifest_version -ne 3) { throw 'Manifest V3 is required.' }
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$name = "youtube-age-filter-v$($manifest.version).zip"
$output = Join-Path $dist $name
$files = @('manifest.json', 'content.js', 'popup.html', 'popup.js', 'README.md', 'LICENSE', 'PRIVACY.md')
Compress-Archive -LiteralPath ($files | ForEach-Object { Join-Path $root $_ }) -DestinationPath $output -Force
$sha = [System.Security.Cryptography.SHA256]::Create()
$stream = [System.IO.File]::OpenRead($output)
try { $hash = ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
finally { $stream.Dispose(); $sha.Dispose() }
[System.IO.File]::WriteAllText((Join-Path $dist 'SHA256SUMS.txt'), "$hash  $name`n")
Write-Output $output
