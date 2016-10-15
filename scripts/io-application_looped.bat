@echo off
call jmeter -n -t "jmeter\io-application\IO-Application Testplan_looped.jmx" -l results\io-application_looped.jtl
