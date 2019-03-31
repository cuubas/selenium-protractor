import { promises as fs } from 'fs';
import * as mkpath from 'mkpath';
import * as p from 'path';
import { TestCase, TestSuite } from './model';
import { TestCaseFormatter } from './test-case-formatter';
import { TestSuiteFormatter } from './test-suite-formatter';

export class Writer {

  constructor(
    private testCaseFormatter: TestCaseFormatter,
    private testSuiteFormatter: TestSuiteFormatter,
  ) { }

  public async transformAndSaveCases(cases: TestCase[], destination: string) {
    for (const testCase of cases) {
      await this.saveCase(testCase, this.caseDestinationPath(testCase.file, destination));
    }
  }

  public caseDestinationPath(casePath: string, destination: string) {
    return p.join(destination, casePath.replace('.html', '.js'));
  }

  public async saveCase(testCase: TestCase, path: string) {
    mkpath.sync(p.dirname(path));
    const output = this.testCaseFormatter.stringify(testCase);
    await fs.writeFile(path, output);
  }

  public async saveSuite(suite: TestSuite, path: string) {
    mkpath.sync(p.dirname(path));
    const output = this.testSuiteFormatter.stringify(suite);
    await fs.writeFile(path, output);
  }
}
