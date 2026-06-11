@echo off
chcp 65001 >nul
rem ─────────────────────────────────────────────────────────────────────
rem  Кнопка: забрать свежий снимок каталога/цен и картинки с NAS в репо.
rem  NAS генерит снимок по расписанию (n8n); ПК забирает перед сборкой.
rem  Запуск: двойной клик или из консоли.
rem ─────────────────────────────────────────────────────────────────────
set NAS=\\192.168.10.5\материалы по обучению\ystroika-catalog
set REPO=%~dp0..\..

echo [1/3] Снимки (latest + версии + отчёт)...
robocopy "%NAS%\src\data\snapshots" "%REPO%\src\data\snapshots" *.json /XO /XX /NJH /NJS /NDL /NC /NS
if %ERRORLEVEL% GEQ 8 goto :err

echo [2/3] Манифест картинок...
robocopy "%NAS%\src\data" "%REPO%\src\data" catalog-images-manifest.json /XO /XX /NJH /NJS /NDL /NC /NS
if %ERRORLEVEL% GEQ 8 goto :err

echo [3/3] Картинки товаров (докачка новых)...
robocopy "%NAS%\public\images\catalog\docke" "%REPO%\public\images\catalog\docke" /XO /XX /NJH /NJS /NDL /NC /NS /NP
if %ERRORLEVEL% GEQ 8 goto :err

echo.
echo Готово: снимок и картинки синхронизированы с NAS.
exit /b 0

:err
echo ОШИБКА синхронизации (robocopy code %ERRORLEVEL%). Проверьте доступ к %NAS%
exit /b 1
