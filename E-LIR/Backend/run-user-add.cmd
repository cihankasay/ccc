@echo off
echo Excel'den kullanici aktarimi baslatiliyor...
node "%~dp0seed-users-from-excel.js"
echo.
echo ✓ Islem tamamlandi.
pause
