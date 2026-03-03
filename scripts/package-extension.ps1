param(
  [ValidateSet("all", "chrome", "firefox")]
  [string]$Browser = "all"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$extensionDir = Join-Path $repoRoot "extension"
$buildRoot = Join-Path $repoRoot ".temp/extension-build"

$targets = if ($Browser -eq "all") {
  @("chrome", "firefox")
} else {
  @($Browser)
}

$manifestByTarget = @{
  chrome = "manifest.chrome.json"
  firefox = "manifest.firefox.json"
}

$artifactByTarget = @{
  chrome = "bukmarks-extension-chrome.zip"
  firefox = "bukmarks-extension-firefox.zip"
}

$filesToCopy = @(
  "popup.html",
  "popup.js",
  "content-script.js",
  "bukmarks-icon.png"
)

if (Test-Path $buildRoot) {
  Remove-Item -Path $buildRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null

foreach ($target in $targets) {
  $buildDir = Join-Path $buildRoot $target
  New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

  foreach ($file in $filesToCopy) {
    Copy-Item -Path (Join-Path $extensionDir $file) -Destination (Join-Path $buildDir $file) -Force
  }

  Copy-Item -Path (Join-Path $extensionDir "icons") -Destination (Join-Path $buildDir "icons") -Recurse -Force

  $manifestSource = Join-Path $extensionDir $manifestByTarget[$target]
  Copy-Item -Path $manifestSource -Destination (Join-Path $buildDir "manifest.json") -Force

  $artifactPath = Join-Path $repoRoot $artifactByTarget[$target]
  if (Test-Path $artifactPath) {
    Remove-Item -Path $artifactPath -Force
  }

  Compress-Archive -Path (Join-Path $buildDir "*") -DestinationPath $artifactPath -Force
  Write-Host "Built $artifactPath"
}
