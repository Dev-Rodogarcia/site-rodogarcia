[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('ports-free', 'release')]
  [string]$Mode
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Mode -eq 'ports-free') {
  $ports = @(6050, 6051, 6060, 6061, 41110, 41112)
  $deadline = (Get-Date).AddSeconds(20)

  do {
    $listeners = @(
      Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $ports -contains $_.LocalPort }
    )
    if ($listeners.Count -eq 0) {
      exit 0
    }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)

  $listeners |
    Select-Object LocalAddress, LocalPort, OwningProcess |
    Format-Table -AutoSize |
    Out-String |
    Write-Error
  exit 1
}

Write-Output '[Rodogarcia PROD] Verificando health, readiness, gateways e Landing Builder ativos...'
$urls = @(
  'http://127.0.0.1:6050/health',
  'http://127.0.0.1:6050/ready',
  'http://127.0.0.1:6051/health',
  'http://127.0.0.1:6051/ready',
  'http://127.0.0.1:6060/admin/auth/entrar',
  'http://127.0.0.1:41110/health',
  'http://127.0.0.1:41112/health'
)
$deadline = (Get-Date).AddSeconds(30)

do {
  $ready = $true
  foreach ($url in $urls) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
      if ($response.StatusCode -ne 200) {
        $ready = $false
        break
      }
    } catch {
      $ready = $false
      break
    }
  }

  if ($ready) {
    exit 0
  }

  Start-Sleep -Milliseconds 500
} while ((Get-Date) -lt $deadline)

Write-Error 'Backend, CMS, gateway ou Landing Builder indisponivel ou sem readiness.'
exit 1
