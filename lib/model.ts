export interface TestCaseCommand {
  type: string;
  locator?: string;
  value: string;
  skip?: boolean;
}

export interface TestCase {
  baseUrl: string;
  path: string;
  file: string;
  title: string;
  commands: TestCaseCommand[];
}

export interface TestSuite {
  title: string;
  file: string;
  cases: TestCase[];
}
