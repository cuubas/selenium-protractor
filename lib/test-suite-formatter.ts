import { TestSuite } from './model';

export class TestSuiteFormatter {

  public stringify(suite: TestSuite) {
    const rows = suite.cases.map((testCase) => {
      return `<tr><td><a href="${testCase.file}">${testCase.title}</a></td></tr>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="content-type" />
  <title>${suite.title}</title>
</head>
<body>
<table id="suiteTable" cellpadding="1" cellspacing="1" border="1" class="selenium"><tbody>
<tr><td><b>${suite.title}</b></td></tr>
${rows.join('\n')}
</tbody></table>
</body>
</html>
`;
  }

}
