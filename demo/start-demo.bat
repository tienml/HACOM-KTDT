@echo off
rem ============================================================
rem  Mo demo HACOM qua web server noi bo.
rem
rem  Vi sao khong mo truc tiep index.html: browser chan luu tru
rem  tren giao thuc file://, nen du lieu se mat khi tai lai trang.
rem  Chay qua http://localhost thi luu duoc binh thuong.
rem ============================================================

setlocal
cd /d "%~dp0"
set PORT=8123

where python >nul 2>&1
if errorlevel 1 goto no_python

echo.
echo   Dang mo demo tai http://localhost:%PORT%
echo   Dong cua so nay de tat demo.
echo.

start "" "http://localhost:%PORT%/index.html"
python -m http.server %PORT% --bind 127.0.0.1
goto end

:no_python
echo.
echo   Khong tim thay Python tren may nay.
echo.
echo   Cach khac: mo index.html truc tiep bang browser. Demo van
echo   chay duoc, nhung du lieu se mat khi tai lai trang.
echo.
pause
start "" "index.html"

:end
endlocal
