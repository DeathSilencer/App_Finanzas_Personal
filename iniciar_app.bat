@echo off
title Suite Financiera Personal - Dashboard Vite
cd /d "%~dp0react-app"
echo ======================================================
echo    SUITE FINANCIERA PERSONAL • REACT 18 & FIRESTORE
echo ======================================================
echo Iniciando servidor de desarrollo en http://localhost:3000 ...
start "" http://localhost:3000/
npm run dev
