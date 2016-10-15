var fs = require('fs');
var fse = require('fs-extra');
var program = require('commander');
var mkdirp = require('mkdirp');
var ncp = require('ncp').ncp;
var VError = require('verror');
var colors = require('colors');
var path = require('path');

program
    .version('0.0.1')
    .description('I/O-Application: copies all files from the source directory to the target directory.')
    .usage("sourceDir targetDir [options]")
    .arguments('<sourceDir> <targetDir>')
    .option('-c --copyfunction <function>', 'select copyfunction to use. fse (=fs-extra) or ncp. fallback is fse.', /^(fse|ncp)$/i)
    .action(function (sourceDir, targetDir) {
        sourceDirPath = path.resolve(sourceDir);
        targetDirPath = path.resolve(targetDir);
    }).parse(process.argv);

if (typeof sourceDirPath === 'undefined') {
    console.error('no source directory given!'.red);
    program.outputHelp();
    process.exit(1);
}

var copyfunction = fse.copy;

if (program.copyfunction == 'ncp') {
    copyfunction = ncp;
} else if (program.copyfunction != undefined && program.copyfunction != 'fse') {
    console.log("no correct copyfuntion! fs-extra will be used");
}

fs.access(sourceDirPath, fs.F_OK, function (err) {
    if (!err) {
        fse.ensureDir(targetDirPath, function (err) {
            if (err) {
                console.error((new VError(err, 'failed to use/create target directory "%s"', targetDirPath)).message.red);
                process.exit(1);
            }
            var start = new Date();
            //ncp much faster than fs.copy -> async
            console.log(copyfunction);
            copyfunction(sourceDirPath, targetDirPath, function (err) {
                if (err) {
                    console.error((new VError(err, 'failed to copy files')).message.red);
                    process.exit(1);
                }
                console.log('done!'.green);

                var end = new Date() - start;
                console.info("Execution time: %dms", end);
            });
        });
    } else {
        console.error("sourceDir \"" + sourceDirPath + "\" does not exist".red);
        process.exit(1);
    }
});