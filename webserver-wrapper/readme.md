# Webserver Wrapper Application

The purpose of this application is to wrap an console application in a web application.

In order to benchmark console applications with JMeter you have to make it accessible via HTTP.
this application just calls a given console application with command line parameters which are passed
inside the query string. JMeter measures the response time and because of this the program call has to be synchronous.