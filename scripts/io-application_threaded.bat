@echo off
call jmeter -n -t "jmeter\io-application\IO-Application Testplan_threaded.jmx" -l results\io-application_threaded.jtl
