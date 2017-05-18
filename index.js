var TestCaseFormatter = require('./lib/test-case-formatter');
var TestSuiteFormatter = require('./lib/test-suite-formatter');
var Writer = require('./lib/writer');
var Transform = require('./lib/transform');

var caseFormatter = new TestCaseFormatter({ whitespace: '    ', endOfLine: require('os').EOL }); // 4 spaces to match coding style
var suiteFormatter = new TestSuiteFormatter();

var writer = new Writer(caseFormatter, suiteFormatter);
var transform = new Transform(writer);

module.exports = transform.run.bind(transform);

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
    transform.run(path, out, suite, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.info('transformed e2e tests');
        }
    });
}

