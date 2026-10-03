param()

$ErrorActionPreference = "Stop"

$documentRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $documentRoot "..\..\..")).Path
$htmlPath = Join-Path $documentRoot "Arquitectura_y_Diseno_Actual_Barberia_Cale.html"
$pdfPath = Join-Path $documentRoot "Arquitectura_y_Diseno_Actual_Barberia_Cale.pdf"
$htmlGenerator = Join-Path $documentRoot "generar-html.js"

Push-Location $repositoryRoot
try {
  & node $htmlGenerator
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo generar el HTML de arquitectura."
  }
}
finally {
  Pop-Location
}

$chromeCandidates = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$chromePath = $chromeCandidates |
  Where-Object { Test-Path -LiteralPath $_ } |
  Select-Object -First 1

if (-not $chromePath) {
  throw "No se encontro Chrome o Edge para generar el PDF."
}

$temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$profileName = "barberia-cale-architecture-pdf-$([Guid]::NewGuid().ToString('N'))"
$profilePath = Join-Path $temporaryRoot $profileName
[void](New-Item -ItemType Directory -Path $profilePath)

try {
  $htmlUri = [Uri]$htmlPath
  $arguments = @(
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--allow-file-access-from-files",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=8000",
    "--user-data-dir=$profilePath",
    "--print-to-pdf=$pdfPath",
    $htmlUri.AbsoluteUri
  )

  $process = Start-Process `
    -FilePath $chromePath `
    -ArgumentList $arguments `
    -PassThru `
    -Wait `
    -WindowStyle Hidden

  if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $pdfPath)) {
    throw "El navegador no pudo generar el PDF."
  }

  Get-Item -LiteralPath $pdfPath |
    Select-Object FullName, Length, LastWriteTime
}
finally {
  if (Test-Path -LiteralPath $profilePath) {
    $resolvedProfile = (Resolve-Path -LiteralPath $profilePath).Path
    $resolvedTemporaryRoot = [IO.Path]::GetFullPath($temporaryRoot).TrimEnd('\')
    $profileLeaf = Split-Path -Leaf $resolvedProfile

    if (
      -not $resolvedProfile.StartsWith(
        "$resolvedTemporaryRoot\",
        [StringComparison]::OrdinalIgnoreCase
      ) -or
      $profileLeaf -notlike "barberia-cale-architecture-pdf-*"
    ) {
      throw "Ruta temporal inesperada; no se eliminara: $resolvedProfile"
    }

    Remove-Item -LiteralPath $resolvedProfile -Recurse -Force
  }
}
