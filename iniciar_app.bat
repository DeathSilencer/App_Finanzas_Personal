@echo off
title Suite Financiera Personal - Dashboard Local
cd /d "%~dp0"
echo ======================================================
echo    SUITE FINANCIERA PERSONAL (DASHBOARD ^& BD LOCAL)
echo ======================================================
echo Iniciando servidor local en http://localhost:8085 ...
start "" http://localhost:8085/gastos/
python backend\server.py
pause
