var cheerio = require('cheerio');
var fs = require('fs');
var async = require('async');
var p = require('path');
var IDE_PREFIX = 'ide:';
var SKIP_PREFIX = 'skip:';

function Parser() {

}
Parser.prototype.toShortPath = function (path, baseDir) {
    path = path.replace(/\\/g, '/').replace(baseDir, '');
    if (path.indexOf('/') === 0) {
        path = path.substring(1);
    }
    return path;
};

Parser.prototype.readCase = function (path, baseDir, callback) {
    async.waterfall([
        (cb) => {
            fs.readFile(path, cb);
        },
        (data, cb) => {
            var $ = cheerio.load(data);
            var ignoreCommands = false;
            var skipCommands = false;
            var testCase = {};
            testCase.baseUrl = $('link[rel="selenium.base"]').attr('href');
            testCase.path = path;
            testCase.file = this.toShortPath(path, baseDir);

            testCase.title = testCase.file;
            testCase.commands = [];
            var handleCommand = (command) => {
                if (command.type === 'it') {
                    skipCommands = command.value.indexOf(SKIP_PREFIX) === 0;
                    ignoreCommands = command.value.indexOf(IDE_PREFIX) === 0;
                    if (skipCommands) {
                        command.value = command.value.substring(SKIP_PREFIX.length).trim();
                    }
                    // convert 1st command to `desc` if next one is `it` (aka 2 comments in a row)
                    if (testCase.commands.length > 0 && testCase.commands[testCase.commands.length - 1].type === 'it') {
                        testCase.commands[testCase.commands.length - 1].type = 'desc';
                    }
                }
                if (skipCommands) {
                    command.skip = true;
                }
                if (!ignoreCommands) {
                    testCase.commands.push(command);
                }
            };
            // $('table tbody').each() doesnt include comments, only tags
            $('table tbody')[0].children.forEach((e) => {
                var command;
                if (e.type === 'tag' && e.tagName.toLowerCase() === 'tr') {
                    var cells = $(e).find('td');
                    command = {};
                    command.type = $(cells[0]).text();
                    command.locator = $(cells[1]).text();
                    command.value = $(cells[2]).text();
                    handleCommand(command);
                } else if (e.type === 'comment') {
                    command = {};
                    command.type = 'it';
                    command.value = e.data;
                    handleCommand(command);
                }
            });
            cb(null, testCase);
        }
    ], callback);
};

Parser.prototype.readCases = function (files, baseDir, parseCases, callback) {
    // by default read cases
    if (typeof parseCases === 'function') {
        callback = parseCases;
        parseCases = true;
    }
    var cases = [];
    baseDir = baseDir.replace(/\\/g, '/');
    // only parse cases when needed (for internal use)
    if (parseCases) {
        async.each(files, (file, cb) => {
            this.readCase(file, baseDir, (err, testCase) => {
                if (testCase) {
                    cases.push(testCase);
                }
                cb();
            });
        }, (err) => {
            callback(err, cases);
        });
    } else {
        callback(null, files.map((path) => {
            var file = this.toShortPath(path, baseDir);
            return {
                path: path,
                file: file,
                title: file
            };
        }))
    }
};

Parser.prototype.readSuite = function (path, parseCases, callback) {
    // by default read cases
    if (typeof parseCases === 'function') {
        callback = parseCases;
        parseCases = true;
    }
    var dir = p.dirname(path);
    var suite = {};
    async.waterfall([
        (cb) => {
            fs.readFile(path, cb);
        },
        (data, cb) => {
            var $ = cheerio.load(data);
            var list = $('table a')
            suite.title = $('title').text();
            suite.file = path;
            var references = list.map((index, e) => {
                return p.join(dir, $(e).attr('href'));
            }).get();
            // only read cases when they are needed, otherwise only keep references
            this.readCases(references, dir, parseCases, cb);

        },
        (cases, cb) => {
            suite.cases = cases;
            cb(null, suite);
        }
    ], callback);
};

Parser.prototype.newSuite = function (title, path) {
    return {
        title: 'Test Suite',
        file: path,
        cases: []
    };
};

module.exports = new Parser();