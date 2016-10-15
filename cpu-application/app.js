var crypto = require('crypto');
var fs = require('fs');
var fse = require('fs-extra');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var program = require('commander');
var path = require('path');
var colors = require('colors');
var VError = require('verror');

// the cipher-algorithms are dependent on OpenSSL and can differ on different machines
// therefore i generate the regExp dynamically and use the first algorithm in the list as fallback
var cipherAlgorithmRegExp = new RegExp('^(' + crypto.getCiphers().join('|') + ')$', 'i');
var defaultCipher = crypto.getCiphers()[0];
var defaultPassword = 'password';
var errorMessageTarPack = "Error creating tar file";
var errorMessageTarExtract = "Error extracting tar file";
var errorMessageReadFile = "Error reading file";
var errorMessageWriteFile = "Error writing file";
var errorMessageEncrypt = "Error encrypting file";
var errorMessageDecrypt = "Error decrypting file";
var errorMessageCompress = "Error compress file";
var errorMessageDecompress = "Error decompress file";

program
    .version('0.0.1')
    .description('CPU-Application: compress and encrypt a file/directory.')
    .arguments('<source>')
    .usage("source [options]")
    .option('-t --target-path <targetPath>', 'set the target path where the (de)compressed file/directory should be stored')
    .option('-a --algorithm <cipheralgorithm>', 'set cipher algorithm. default: ' + defaultCipher, cipherAlgorithmRegExp, defaultCipher)
    .option('-c --count <count>', 'how often the cipher algorithm should be applied', parseInt)
    .option('-p --password <password>', 'set encryption password. default password is "' + defaultPassword + '"')
    .option('-d --decrypt', 'decrypt file')
    .action(function (sourceDir) {
        sourcePath = path.resolve(sourceDir);
    }).parse(process.argv);

if (typeof sourcePath === 'undefined') {
    console.error('no source directory given!'.red);
    program.outputHelp();
    process.exit(1);
}

if (program.count != undefined && isNaN(program.count)) {
    console.error('count was not a number!'.red);
    program.outputHelp();
    process.exit(1);
}

var algorithmCount = program.count || 1;
var password = new Buffer(program.password || defaultPassword);
var targetPath = sourcePath;

if (program.targetPath != undefined) {
    targetPath = path.resolve(path.join(program.targetPath, path.basename(sourcePath)));
    try {
        fse.ensureDirSync(path.resolve(program.targetPath));
    } catch (err) {
        if (err) {
            console.error((new VError(err, 'failed to use/create target directory "%s"', targetPath)).message.red);
            process.exit(1);
        }
    }
}

if (!program.decrypt) {

    // check file/folder exists
    fs.access(sourcePath, fs.F_OK, function (err) {
        if (!err) {
            var gzip = zlib.createGzip();

            if (fs.lstatSync(sourcePath).isDirectory()) {
                var readStream = fstream.Reader(sourcePath);
                var writeStream = fs.createWriteStream(targetPath + '.tar.gz');

                var stream = readStream.on('error', function (e) {
                    handleError(e, errorMessageReadFile);
                })
                    .pipe(tar.Pack()).on('error', function (e) {
                        handleError(e, errorMessageTarPack);
                    });

                for (i = 0; i < algorithmCount; i++) {
                    stream = stream.pipe(crypto.createCipher(program.algorithm || defaultCipher, password)).on('error', function (e) {
                        handleError(e, errorMessageEncrypt);
                    });
                }

                stream.pipe(gzip).on('error', function (e) {
                    handleError(e, errorMessageCompress);
                })
                    .pipe(writeStream).on('error', function (e) {
                    handleError(e, errorMessageWriteFile);
                })
                    .on('finish', function () {
                        console.log('done'.green);
                    });
            }
            else {
                var readStream = fs.createReadStream(sourcePath);
                var writeStream = fs.createWriteStream(targetPath + '.gz');

                var stream = readStream.on('error', function (e) {
                    handleError(e, errorMessageReadFile);
                });

                for (i = 0; i < algorithmCount; i++) {
                    stream = stream.pipe(crypto.createCipher(program.algorithm || defaultCipher, password)).on('error', function (e) {
                        handleError(e, errorMessageEncrypt);
                    });
                }

                stream.pipe(gzip).on('error', function (e) {
                    handleError(e, errorMessageCompress);
                })
                    .pipe(writeStream).on('error', function (e) {
                    handleError(e, errorMessageWriteFile);
                })
                    .on('finish', function () {
                        console.log('done'.green);
                    });
            }
        } else {
            console.error("source \"" + sourcePath + "\" does not exist".red);
            process.exit(1);
        }
    });
} else {
    // check file/folder exists
    fs.access(sourcePath, fs.F_OK, function (err) {
        if (!err) {
            var gzip = zlib.createGunzip();
            var readStream = fs.createReadStream(sourcePath);

            if (sourcePath.endsWith(".tar.gz")) { // folder
                var stream = readStream.on('error', function (e) {
                    handleError(e, errorMessageReadFile);
                })
                    .pipe(gzip).on('error', function (e) {
                        handleError(e, errorMessageDecompress);
                    });

                for (i = 0; i < algorithmCount; i++) {
                    stream = stream.pipe(crypto.createDecipher(program.algorithm || defaultCipher, password)).on('error', function (e) {
                        handleError(e, errorMessageDecrypt);
                    });
                }

                stream.pipe(tar.Extract({path: path.dirname(targetPath)})).on('error', function (e) {
                    handleError(e, errorMessageTarExtract);
                })
                    .on('finish', function () {
                        console.log('done'.green);
                    });
            } else if (sourcePath.endsWith(".gz")) { //file -> no tar
                var writeStream = fs.createWriteStream(targetPath.replace(".gz", ""));

                var stream = readStream.on('error', function (e) {
                    handleError(e, errorMessageReadFile);
                })
                    .pipe(gzip).on('error', function (e) {
                        handleError(e, errorMessageDecompress);
                    });

                for (i = 0; i < algorithmCount; i++) {
                    stream = stream.pipe(crypto.createDecipher(program.algorithm || defaultCipher, password)).on('error', function (e) {
                        handleError(e, errorMessageDecrypt);
                    });
                }

                stream.pipe(writeStream).on('error', function (e) {
                    handleError(e, errorMessageWriteFile);
                })
                    .on('finish', function () {
                        console.log('done'.green);
                    });
            } else {
                console.error("unknown format source format!".red);
                process.exit(1);
            }

        } else {
            console.error("source \"" + sourcePath + "\" does not exist".red);
            process.exit(1);
        }
    });
}

function handleError(err, msg) {
    console.error((new VError(err, msg)).stack.red);
    process.exit(1);
}
