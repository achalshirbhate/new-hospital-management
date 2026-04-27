@echo off
echo ================================================
echo   Hospital Management - APK Builder
echo ================================================
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/3] Installing EAS CLI...
call npm install -g eas-cli
if %errorlevel% neq 0 (
    echo ERROR: eas-cli install failed
    pause
    exit /b 1
)

echo.
echo [3/3] Building APK (this takes 5-10 minutes)...
echo You will be asked to log in to your Expo account.
echo If you don't have one, create a FREE account at https://expo.dev
echo.
call eas build --platform android --profile preview --non-interactive

echo.
echo ================================================
echo   BUILD COMPLETE!
echo   Download your APK from the link above
echo   or visit: https://expo.dev
echo ================================================
pause
