@echo off
setlocal enabledelayedexpansion

echo 🔄 Sauvegarde Git en cours...

:: Demande le nom de sauvegarde (utilisé comme repère)
set /p saveName=💡 Entrez le nom de sauvegarde (répertoire/log/repère) : 
if "!saveName!"=="" (
    set saveName=sauvegarde_auto
)

:: Demande le message de commit
set /p commitMsg=🖊️ Entrez le message de commit : 
if "!commitMsg!"=="" (
    set commitMsg=💾 Sauvegarde automatique (!saveName!)
)

echo 📦 Ajout des fichiers modifiés...
git add .

echo 📄 Commit en cours...
git commit -m "!commitMsg!"

echo 🚀 Envoi vers le dépôt distant...
git push origin main

:: Vérification des erreurs
if %errorlevel% neq 0 (
    echo ❌ Une erreur s'est produite pendant la sauvegarde Git.
) else (
    echo ✅ Sauvegarde "!saveName!" terminée avec le message : "!commitMsg!"
)

pause