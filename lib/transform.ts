import * as globby from 'globby';
import * as p from 'path';
import { Parser } from './parser';
import { Writer } from './writer';

export class Transform {
  private parser = new Parser();

  constructor(
    private writer: Writer,
  ) { }

  public async run(source, destination, suitePath, delta = false) {

    const baseDir = p.dirname(suitePath);
    // nothing to do if files list is empty
    if (Array.isArray(source) && source.length === 0) {
      return;
    }

    // convert from html
    const files = await globby(source);
    const cases = await this.parser.readCases(files, baseDir);

    await this.writer.transformAndSaveCases(cases, destination);

    let suite;
    try {
      suite = await this.parser.readSuite(suitePath);
    } catch (err) {
      suite = this.parser.newSuite('Test Suite', suitePath);
    }

    // add only missing cases
    if (delta) {
      cases.forEach((testCase) => {
        if (suite.cases.filter((tmp) => tmp.file === testCase.file).length === 0) {
          suite.cases.push(testCase);
        }
      });
    } else {
      suite.cases = cases;
    }
    // sort by file
    suite.cases.sort((a, b) => {
      if (a.file < b.file) { return -1; }
      if (a.file > b.file) { return 1; }
      return 0;
    });

    await this.writer.saveSuite(suite, suitePath);
  }
}
