@echo off
echo Starting Email Marketing Platform...
echo.

echo [1/3] Starting Docker services (PostgreSQL + Redis)...
start "Docker Services" cmd /k "docker-compose up"
timeout /t 5 /nobreak >nul

echo [2/3] Starting Backend (NestJS)...
start "Backend" cmd /k "npm run start:dev"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend (Next.js)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Docker Services: http://localhost:5432 (PostgreSQL) + http://localhost:6379 (Redis)
echo Backend API: http://localhost:3000
echo Frontend UI: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul
