import { TestCaseFormatter } from './lib/test-case-formatter';
import { TestSuiteFormatter } from './lib/test-suite-formatter';
import { Transform } from './lib/transform';
import { Writer } from './lib/writer';

const caseFormatter = new TestCaseFormatter({ whitespace: '    ', endOfLine: require('os').EOL }); // 4 spaces to match coding style
const suiteFormatter = new TestSuiteFormatter();

const writer = new Writer(caseFormatter, suiteFormatter);
const transform = new Transform(writer);

module.exports = transform.run.bind(transform);

if (!module.parent) {
    const path = process.argv[2];
    if (!path) {
        throw new Error('specify input glob');
    }
    const out = process.argv[3];
    if (!out) {
        throw new Error('specify destination path');
    }
    const suite = process.argv[4];
    if (!suite) {
        throw new Error('specify suite path');
    }
    transform.run(path, out, suite).then(() => {
        // tslint:disable-next-line:no-console
        console.info('transformed e2e tests');
    }, (err) => {
        // tslint:disable-next-line:no-console
        console.error(err);
    });
}
