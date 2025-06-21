@echo off
setlocal

echo 🔄 Sauvegarde Git en cours...
set /p commitMsg=🖊️ Entrez le message de commit : 

if "%commitMsg%"=="" (
    set commitMsg=💾 Sauvegarde automatique
)

git add .
git commit -m "%commitMsg%"
git push origin main

if %errorlevel% neq 0 (
    echo ❌ Une erreur s'est produite pendant la sauvegarde Git.
) else (
    echo ✅ Sauvegarde terminée avec le message : %commitMsg%
)

pause