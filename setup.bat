@echo off
echo.
echo ============================================
echo   GRAN CANARIA CONECTA - Setup
echo ============================================
echo.

REM 1. Create db folder
if not exist "db" (
    mkdir db
    echo [OK] Created db folder
) else (
    echo [OK] db folder exists
)

REM 2. Create .env file
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Created .env from .env.example
    ) else (
        echo DATABASE_URL=file:./db/custom.db > .env
        echo [OK] Created .env with default DATABASE_URL
    )
) else (
    echo [OK] .env file exists
)

REM 3. Generate Prisma client
echo.
echo [1/3] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

REM 4. Push schema to database
echo.
echo [2/3] Creating database...
call npx prisma db push
if errorlevel 1 (
    echo [ERROR] Failed to create database
    pause
    exit /b 1
)

REM 5. Seed database
echo.
echo [3/3] Seeding demo data...
call npx tsx prisma/seed.ts
if errorlevel 1 (
    echo [WARN] Seed had issues - database may already have data
)

echo.
echo ============================================
echo   Setup complete!
echo   Now run: bun run dev
echo ============================================
echo.
pause
