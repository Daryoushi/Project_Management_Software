@echo off
echo ==========================================================
echo    Asana & Jira Project Management Platform (Full-Stack)
echo ==========================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8001 ...
start "PM FastAPI Backend" cmd /k "cd backend && python run.py"

echo Starting Next.js Frontend on http://localhost:3000 ...
start "PM Next.js Frontend" cmd /k "cd frontend && npm.cmd run start"

echo.
echo ==========================================================
echo  Application is running!
echo  - Frontend: http://localhost:3000
echo  - Backend API & Swagger: http://127.0.0.1:8001/docs
echo ==========================================================
pause
