[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$developmentPorts = @(31012, 31013, 35180, 35013, 36110, 35112)
$listeners = @(
  Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $developmentPorts -contains $_.LocalPort } |
    Sort-Object LocalPort
)

if ($listeners.Count -eq 0) {
  exit 0
}

$activePorts = ($listeners | ForEach-Object { $_.LocalPort } | Sort-Object -Unique) -join ', '
[Console]::Error.WriteLine("[Rodogarcia PROD] Processos DEV ativos nas portas $activePorts. O pre-flight usa npm ci e nao pode compartilhar node_modules com DEV. Encerre o DEV manualmente e execute novamente.")
exit 1
