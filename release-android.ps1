param(
  [string]$message = "release"
)

Write-Host "`n=== Step 1: Computing fingerprint from current codebase ===" -ForegroundColor Cyan
$fpOutput = npx @expo/fingerprint . 2>&1
$cliFingerprint = ($fpOutput | ConvertFrom-Json).hash
Write-Host "CLI fingerprint: $cliFingerprint" -ForegroundColor Yellow

Write-Host "`n=== Step 2: Building release APK ===" -ForegroundColor Cyan
& "$PSScriptRoot\android\gradlew" -p "$PSScriptRoot\android" assembleRelease
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed!" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== Step 3: Extracting fingerprint from built APK ===" -ForegroundColor Cyan
$apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
$entry = $zip.Entries | Where-Object { $_.FullName -eq "assets/fingerprint" }
if ($entry) {
  $reader = New-Object System.IO.StreamReader($entry.Open())
  $apkFingerprint = ($reader.ReadToEnd().Trim() | ConvertFrom-Json).hash
  $reader.Close()
} else {
  Write-Host "No fingerprint file found in APK (manual version mode)" -ForegroundColor Yellow
  $apkFingerprint = "manual"
}
$zip.Dispose()
Write-Host "APK fingerprint: $apkFingerprint" -ForegroundColor Yellow

Write-Host "`n=== Step 4: Comparing fingerprints ===" -ForegroundColor Cyan
if ($apkFingerprint -eq "manual") {
  Write-Host "Using manual runtime version - skipping fingerprint check" -ForegroundColor Yellow
} elseif ($cliFingerprint -eq $apkFingerprint) {
  Write-Host "Fingerprints MATCH" -ForegroundColor Green
} else {
  Write-Host "MISMATCH DETECTED!" -ForegroundColor Red
  Write-Host "  CLI    : $cliFingerprint"
  Write-Host "  APK    : $apkFingerprint"
  Write-Host "Run: npx @expo/fingerprint . --diff to see what changed" -ForegroundColor Yellow
  $confirm = Read-Host "Push OTA anyway? (y/N)"
  if ($confirm -ne "y") { exit 1 }
}

Write-Host "`n=== Step 5: Pushing OTA update ===" -ForegroundColor Cyan
eas update --branch production --message $message
Write-Host "`nDone! Install APK from:" -ForegroundColor Green
Write-Host "  $apkPath"
