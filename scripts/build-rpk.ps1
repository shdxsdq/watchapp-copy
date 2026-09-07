$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$studioPath = 'C:\Users\DQ\AppData\Local\Programs\BlueOSStudio'
$nodePath = Get-ChildItem -LiteralPath $studioPath -Filter 'node.exe' -File -Recurse |
  Select-Object -First 1 -ExpandProperty FullName
$packPath = Get-ChildItem -LiteralPath $studioPath -Filter 'index.js' -File -Recurse |
  Where-Object { $_.FullName -match 'blueos-pack\\bin\\index\.js$' } |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $nodePath -or -not $packPath) {
  throw '没有找到 BlueOS Studio 自带的编译工具。'
}

Set-Location -LiteralPath $projectPath
& $nodePath '.\scripts\buildLocalLibrary.mjs'
if ($LASTEXITCODE -ne 0) { throw 'TXT 生成失败，请确认全部文件为 UTF-8 编码。' }

$manifestPath = Join-Path $projectPath 'src\manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$manifest.versionCode = [int]$manifest.versionCode + 1
$parts = @($manifest.versionName -split '\.')
$parts[2] = ([int]$parts[2] + 1).ToString()
$manifest.versionName = $parts -join '.'
$manifest | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $manifestPath -Encoding utf8

& $nodePath $packPath build --device-type watch-square -f
if ($LASTEXITCODE -ne 0) { throw 'RPK 构建失败。' }

$rpk = Get-ChildItem -LiteralPath (Join-Path $projectPath 'dist\watch-square\debug') -Filter '*.rpk' -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
Write-Host ''
Write-Host "完成：$($rpk.FullName)" -ForegroundColor Green
