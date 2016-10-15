var program = require('commander');
var express = require('express');
var colors = require('colors');
const execSync = require('child_process').execSync;

var defaultPort = 8080;
var argsQueryParameterKey = "args";

program
    .version('0.0.1')
    .description('Webserver-Wrapper-Application: wraps a console application in a web application.')
    .arguments('<source>')
    .option('-a --application <application>', 'set the application which should be wrapped')
    .option('-p --port <port>', 'set the port of the web server', parseInt)
    .parse(process.argv);

if (typeof program.application === 'undefined') {
    console.error('no application given!'.red);
    program.outputHelp();
    process.exit(1);
}

if (program.port != undefined && isNaN(program.port)) {
    console.error('port was not a number!'.red);
    program.outputHelp();
    process.exit(1);
}


var app = express();

var server = app.listen(program.port || defaultPort, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("wrapper listening at http://%s:%s", host, port)
});

app.get('/', function (req, res) {
    var start = new Date().getTime();
    var command = program.application;
    var output ="";

    if (req.query[argsQueryParameterKey] != undefined) {
        command += " " + req.query[argsQueryParameterKey];
    }
    try{
        output = execSync(command);
    }catch (err){
        output = err.message;
    }
    output = output.toString().replace(/\n/g, "<br />");

    var end = new Date().getTime();
    var time = end - start;
    res.send('Execution time: ' + time + ' <br \> ' + output);
});