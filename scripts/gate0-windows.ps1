$ErrorActionPreference = 'Stop'

# Keep Windows PowerShell output readable in Windows Terminal.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$logFile = Join-Path (Get-Location) 'gate0-output.txt'
Start-Transcript -Path $logFile -Force | Out-Null

function Write-Step([string]$message) {
    Write-Host "`n=== $message ===" -ForegroundColor Cyan
}

function Assert-Command([string]$commandName) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "Commande introuvable : $commandName"
    }
}

try {
    Write-Step 'Verification des prerequis'
    Assert-Command 'node'
    Assert-Command 'npm'
    Assert-Command 'git'

    $nodeVersion = node --version
    $npmVersion = npm --version
    $gitVersion = git --version

    Write-Host "Node : $nodeVersion"
    Write-Host "npm  : $npmVersion"
    Write-Host "Git  : $gitVersion"

    $nodeSemver = [version]($nodeVersion -replace '^v','')
    $minimumNode = [version]'20.19.0'
    if ($nodeSemver -lt $minimumNode) {
        throw "Node.js $minimumNode minimum requis pour cette branche. Version detectee : $nodeVersion"
    }

    Write-Step 'Verification de la branche Git'
    $branch = git branch --show-current
    Write-Host "Branche actuelle : $branch"
    if ($branch -ne 'foundation/electron-react-sqlite') {
        throw "Mauvaise branche. Attendue : foundation/electron-react-sqlite ; actuelle : $branch"
    }

    Write-Step 'Etat Git avant validation'
    git status --short

    Write-Step 'Installation des dependances'
    if (Test-Path 'package-lock.json') {
        npm ci
    } else {
        npm install
    }
    if ($LASTEXITCODE -ne 0) { throw 'npm install/ci a echoue.' }

    Write-Step 'TypeScript'
    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw 'Le typecheck a echoue.' }

    Write-Step 'Tests Vitest'
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Les tests ont echoue.' }

    Write-Step 'Packaging Electron'
    npm run package
    if ($LASTEXITCODE -ne 0) { throw 'Le packaging a echoue.' }

    Write-Step 'Etat Git apres validation'
    git status --short

    Write-Host "`nGATE 0 AUTOMATIQUE : OK" -ForegroundColor Green
    Write-Host "Le fichier package-lock.json a pu etre cree. Ne pas le supprimer."
    Write-Host "Etape suivante : lancer manuellement 'npm start' pour valider l'application visuellement."
}
catch {
    Write-Host "`nGATE 0 AUTOMATIQUE : ECHEC" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Copie ou envoie le fichier gate0-output.txt pour diagnostic."
    exit 1
}
finally {
    Stop-Transcript | Out-Null
}
