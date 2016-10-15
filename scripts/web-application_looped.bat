@echo off

call jmeter -n -t "jmeter\web-application\web-application_clear_db.jmx" > NUL
call jmeter -n -t "jmeter\web-application\web-application_threaded.jmx" -l results\web-application_looped.jtl
call jmeter -n -t "jmeter\web-application\web-application_clear_db.jmx" > NUL