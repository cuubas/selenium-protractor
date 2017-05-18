var templates = {};

var p = require('path');
var async = require('async');
var globby = require('globby');
var parser = require('./lib/parser');
var Formatter = require('./lib/formatter');
var handlers = require('./lib/handlers');
var locators = require('./lib/locators');

var formatter = new Formatter({ whitespace: '    ' }); // 4 spaces to match coding style

templates.header = `// injected header` + formatter.endOfLine;

module.exports = transform;

if (!module.parent) {
    var path = process.argv[2];
    if (!path) {
        throw new Error("specify input glob");
    }
    var out = process.argv[3];
    if (!out) {
        throw new Error("specify destination path");
    }
    var suite = process.argv[4];
    if (!suite) {
        throw new Error("specify suite path");
    }
    transform(path, out, suite, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.info('transformed e2e tests');
        }
    });
}

function transform(source, destination, suitePath, delta, callback) {
    // delta is optional
    if (typeof delta === 'function') {
        callback = delta;
        delta = false;
    }
    var baseDir = p.dirname(suitePath);
    // nothing to do if files list is empty
    if (Array.isArray(source) && source.length === 0) {
        callback(null);
        return;
    }
    // convert from html
    var _cases;
    async.waterfall([
        (cb) => {
            globby(source)
                .then((files) => parser.readCases(files, baseDir, cb))
                .catch((err) => cb(err));
        },
        (cases, cb) => {
            _cases = cases;
            // process test cases
            formatter.transformAndSaveCases(cases, destination, cb);
        },
        (cb) => {
            // read current test suite
            parser.readSuite(suitePath, false, (err, suite) => {
                cb(null, suite);
            });
        },
        (suite, cb) => {
            if (!suite) {
                suite = parser.newSuite("Test Suite", suitePath);
            }
            // add only missing cases
            if (delta) {
                _cases.forEach((testCase) => {
                    if (suite.cases.filter((tmp) => tmp.file === testCase.file).length === 0) {
                        suite.cases.push(testCase);
                    }
                });
            } else {
                suite.cases = _cases;
            }
            // sort by file
            suite.cases.sort((a, b) => {
                if (a.file < b.file) return -1;
                if (a.file > b.file) return 1;
                return 0;
            });
            formatter.saveSuite(suite, suitePath, cb);
        }
    ], callback);
}
