@echo off
setlocal
rem Installs the Android 36 emulator image and SDK tools with the current "android sdk" CLI.
rem (sdkmanager is deprecated and splits the semicolons in package ids.)
set "ANDROID_BIN=%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin"
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
"%ANDROID_BIN%\android.exe" sdk install "system-images;android-36;google_apis;x86_64" "platform-tools" "platforms;android-36" "build-tools;36.0.0" "emulator"
