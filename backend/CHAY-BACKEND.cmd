@echo off
chcp 65001 >nul
title SmartCool AI Backend
cd /d "%~dp0"
echo ========================================
echo   SMARTCOOL AI - CHAY BACKEND
echo ========================================
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Da tao file .env tu .env.example.
  echo Hay mo backend\.env, sua DATABASE_URL va JWT_ACCESS_SECRET roi chay lai file nay.
  notepad ".env"
  pause
  exit /b
)
echo [1/4] Cai thu vien...
call npm install || goto :error
echo [2/4] Tao bang trong database (migrate)...
call npx prisma migrate deploy || goto :error
echo [3/4] Nap du lieu mau (seed)...
call npm run db:seed || goto :error
echo [4/4] Khoi dong server http://localhost:5000 ...
call npm run dev
goto :eof
:error
echo.
echo CO LOI! Kiem tra PostgreSQL da chay chua va DATABASE_URL trong .env.
pause
