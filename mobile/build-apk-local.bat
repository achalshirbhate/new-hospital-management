@echo off
echo ================================================
echo   Hospital Management - LOCAL APK Builder
echo   (No Expo account needed)
echo ================================================
echo.
echo Requires: Android Studio + Java JDK installed
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit /b 1 )

echo.
echo [2/3] Installing expo-dev-client...
call npx expo install expo-dev-client
if %errorlevel% neq 0 ( echo ERROR: expo-dev-client install failed & pause & exit /b 1 )

echo.
echo [3/3] Building local APK...
call npx expo run:android --variant release

echo.
echo ================================================
echo APK location: android/app/build/outputs/apk/release/
echo ================================================
pause
