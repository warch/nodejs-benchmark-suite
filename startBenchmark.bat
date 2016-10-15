@echo off
call scripts\startNodeApplications.bat
echo "Waiting 15s for the servers to start"
timeout 15 > NUL
call scripts\io-application_looped.bat
rmdir /S /Q tmp 
call scripts\io-application_threaded.bat
rmdir /S /Q tmp 
call scripts\cpu-application_looped.bat
rmdir /S /Q tmp 
call scripts\cpu-application_threaded.bat
rmdir /S /Q tmp 
call scripts\web-application_looped.bat
call scripts\web-application_threaded.bat