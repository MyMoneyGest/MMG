#!/bin/bash

echo "🔄 Sauvegarde Git en cours..."

git add .
git commit -m "💾 Sauvegarde automatique"
git push origin main

echo "✅ Sauvegarde terminée et envoyée sur GitHub."