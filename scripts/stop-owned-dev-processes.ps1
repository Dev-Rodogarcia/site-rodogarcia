[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryRoot,

  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$resolvedRepositoryRoot = [IO.Path]::GetFullPath($RepositoryRoot).TrimEnd([char]92)
$portNumbers = @(31012, 31013, 35180, 35013, 36110, 35112)

function Test-RepositoryProcess {
  param(
    [Parameter(Mandatory = $true)]
    [int]$ProcessId,

    [Parameter(Mandatory = $true)]
    [string]$Root
  )

  $seenProcessIds = @{}
  $currentProcessId = $ProcessId

  for ($depth = 0; $depth -lt 8 -and $currentProcessId -gt 0; $depth++) {
    if ($seenProcessIds.ContainsKey($currentProcessId)) {
      return $false
    }

    $seenProcessIds[$currentProcessId] = $true
    $process = Get-CimInstance Win32_Process -Filter ('ProcessId = {0}' -f $currentProcessId) -ErrorAction SilentlyContinue
    if (-not $process) {
      return $false
    }

    $commandLine = [string]$process.CommandLine
    if ($commandLine.IndexOf($Root, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
      return $true
    }

    $currentProcessId = [int]$process.ParentProcessId
  }

  return $false
}

$listeners = @(
  Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $portNumbers -contains $_.LocalPort }
)
$ownedProcessIds = @()
$foreignProcesses = @()

foreach ($group in ($listeners | Group-Object OwningProcess)) {
  $portsInUse = ($group.Group | ForEach-Object LocalPort | Sort-Object -Unique) -join ','
  $processId = [int]$group.Name

  if (Test-RepositoryProcess -ProcessId $processId -Root $resolvedRepositoryRoot) {
    $ownedProcessIds += $processId
  } else {
    $foreignProcesses += ('porta(s) {0}, PID {1}' -f $portsInUse, $processId)
  }
}

if ($foreignProcesses.Count -gt 0) {
  Write-Error ('Porta DEV ocupada por outro projeto: ' + ($foreignProcesses -join '; '))
  exit 2
}

if ($DryRun) {
  $ownedPorts = if ($ownedProcessIds.Count -gt 0) {
    $ownedProcessIds -join ','
  } else {
    'nenhum'
  }
  Write-Output ('Processos DEV do repositorio identificados: ' + $ownedPorts)
  exit 0
}

foreach ($processId in ($ownedProcessIds | Select-Object -Unique)) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
  } catch {
    # O processo pode ter encerrado entre a coleta do listener e esta etapa.
  }
}
