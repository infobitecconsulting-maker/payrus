@echo off
setlocal
cd /d "%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin"
sdkmanager.bat --install "system-images;android-36;google_apis;x86_64" "platform-tools" "platforms;android-36" "build-tools;36.0.0" "emulator"
