@echo off
setlocal

echo 🔄 Sauvegarde Git en cours...

:: Demande le nom de sauvegarde
set /p saveName=💡 Entrez le nom de sauvegarde (répertoire/log/repère) : 

:: Vérifie si un nom a été entré
if "%saveName%"=="" (
    set saveName=sauvegarde_auto
)

:: Optionnel : Crée un dossier pour y logguer la date ou stocker des backups
:: mkdir backups\%saveName% 2>nul

:: Demande le message de commit
set /p commitMsg=🖊️ Entrez le message de commit : 

if "%commitMsg%"=="" (
    set commitMsg=💾 Sauvegarde automatique (%saveName%)
)

:: Ajout, commit et push Git
git add .
git commit -m "%commitMsg%"
git push origin main

:: Vérification des erreurs
if %errorlevel% neq 0 (
    echo ❌ Une erreur s'est produite pendant la sauvegarde Git.
) else (
    echo ✅ Sauvegarde "%saveName%" terminée avec le message : %commitMsg%
)

pause