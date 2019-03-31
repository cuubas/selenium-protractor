import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import * as p from 'path';
import { TestCase, TestCaseCommand, TestSuite } from './model';

const IDE_PREFIX = 'ide:';
const SKIP_PREFIX = 'skip:';
const IF_PREFIX_REGEX = /^@if\(([^:]*)\)\:/;

export class Parser {

    public async readCase(path: string, baseDir: string): Promise<TestCase> {

        const data = await fs.readFile(path);

        const $ = cheerio.load(data);
        let ignoreCommands = false;
        let skipCommands = false;
        const file = this.toShortPath(path, baseDir);

        const testCase: TestCase = {
            baseUrl: $('link[rel="selenium.base"]').attr('href'),
            path,
            file,
            title: file,
            commands: [],
        };

        const handleCommand = (command: TestCaseCommand) => {
            if (command.type === 'it') {
                const condition = command.value.match(IF_PREFIX_REGEX);
                if (condition) {
                    // TODO: support all html entities?
                    command.condition = condition[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                    command.value = command.value.substring(condition[0].length).trim();
                }

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
            let command: TestCaseCommand;
            if (e.type === 'tag' && e.tagName.toLowerCase() === 'tr') {
                const cells = $(e).find('td');
                command = {
                    type: $(cells[0]).text(),
                    locator: $(cells[1]).text(),
                    value: $(cells[2]).text(),
                };
                handleCommand(command);
            } else if (e.type === 'comment') {
                command = {
                    type: 'it',
                    value: e.data,
                };
                handleCommand(command);
            }
        });
        return testCase;
    }

    public async readCases(files: string[], baseDir: string, parseCases = true): Promise<TestCase[]> {
        // by default read cases
        const cases: TestCase[] = [];
        baseDir = baseDir.replace(/\\/g, '/');
        for (const file of files) {
            // only parse cases when needed (for internal use)
            if (parseCases) {
                const testCase = await this.readCase(file, baseDir);
                if (testCase) {
                    cases.push(testCase);
                }
            } else {
                cases.push({
                    baseUrl: '',
                    path: file,
                    file,
                    title: file,
                    commands: [],
                });
            }
        }
        return cases;
    }

    public async readSuite(path: string, parseCases = true): Promise<TestSuite> {
        const dir = p.dirname(path);
        const data = await fs.readFile(path);

        const $ = cheerio.load(data);
        const list = $('table a');

        const references = list.map((index, e) => {
            return p.join(dir, $(e).attr('href'));
        }).get();

        const suite: TestSuite = {
            title: $('title').text(),
            file: path,
            cases: await this.readCases(references, dir, parseCases),
        };

        return suite;
    }

    public newSuite(title: any, path: string): TestSuite {
        return {
            title: title || 'Test Suite',
            file: path,
            cases: [],
        };
    }

    private toShortPath(path: string, baseDir: string) {
        path = path.replace(/\\/g, '/').replace(baseDir, '');
        if (path.indexOf('/') === 0) {
            path = path.substring(1);
        }
        return path;
    }

}
