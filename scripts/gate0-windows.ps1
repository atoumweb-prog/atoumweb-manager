$ErrorActionPreference = 'Stop'

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
    Write-Step 'Vérification des prérequis'
    Assert-Command 'node'
    Assert-Command 'npm'
    Assert-Command 'git'

    $nodeVersion = node --version
    $npmVersion = npm --version
    $gitVersion = git --version

    Write-Host "Node : $nodeVersion"
    Write-Host "npm  : $npmVersion"
    Write-Host "Git  : $gitVersion"

    $major = [int](($nodeVersion -replace '^v','').Split('.')[0])
    if ($major -lt 24) {
        throw "Node.js 24 LTS minimum requis pour cette branche. Version détectée : $nodeVersion"
    }

    Write-Step 'Vérification de la branche Git'
    $branch = git branch --show-current
    Write-Host "Branche actuelle : $branch"
    if ($branch -ne 'foundation/electron-react-sqlite') {
        throw "Mauvaise branche. Attendue : foundation/electron-react-sqlite ; actuelle : $branch"
    }

    Write-Step 'État Git avant validation'
    git status --short

    Write-Step 'Installation des dépendances'
    if (Test-Path 'package-lock.json') {
        npm ci
    } else {
        npm install
    }
    if ($LASTEXITCODE -ne 0) { throw 'npm install/ci a échoué.' }

    Write-Step 'TypeScript'
    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw 'Le typecheck a échoué.' }

    Write-Step 'Tests Vitest'
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Les tests ont échoué.' }

    Write-Step 'Packaging Electron'
    npm run package
    if ($LASTEXITCODE -ne 0) { throw 'Le packaging a échoué.' }

    Write-Step 'État Git après validation'
    git status --short

    Write-Host "`nGATE 0 AUTOMATIQUE : OK" -ForegroundColor Green
    Write-Host "Le fichier package-lock.json a pu être créé. Ne pas le supprimer."
    Write-Host "Étape suivante : lancer manuellement 'npm start' pour valider l'application visuellement."
}
catch {
    Write-Host "`nGATE 0 AUTOMATIQUE : ÉCHEC" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Copie ou envoie le fichier gate0-output.txt pour diagnostic."
    exit 1
}
finally {
    Stop-Transcript | Out-Null
}
