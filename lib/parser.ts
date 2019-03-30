import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import * as p from 'path';

const IDE_PREFIX = 'ide:';
const SKIP_PREFIX = 'skip:';

export class Parser {

    public toShortPath(path, baseDir) {
        path = path.replace(/\\/g, '/').replace(baseDir, '');
        if (path.indexOf('/') === 0) {
            path = path.substring(1);
        }
        return path;
    }

    public async readCase(path: string, baseDir: string) {

        const data = await fs.readFile(path);

        const $ = cheerio.load(data);
        let ignoreCommands = false;
        let skipCommands = false;
        const testCase = {} as any;
        testCase.baseUrl = $('link[rel="selenium.base"]').attr('href');
        testCase.path = path;
        testCase.file = this.toShortPath(path, baseDir);

        testCase.title = testCase.file;
        testCase.commands = [];

        const handleCommand = (command) => {
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
            let command;
            if (e.type === 'tag' && e.tagName.toLowerCase() === 'tr') {
                const cells = $(e).find('td');
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
        return testCase;
    }

    public async readCases(files: string[], baseDir: string, parseCases = true) {
        // by default read cases
        const cases = [];
        baseDir = baseDir.replace(/\\/g, '/');
        // only parse cases when needed (for internal use)
        if (parseCases) {

            for (const file of files) {
                const testCase = await this.readCase(file, baseDir);
                if (testCase) {
                    cases.push(testCase);
                }
            }
            return cases;
        } else {
            return files.map((path) => {
                const file = this.toShortPath(path, baseDir);
                return {
                    path,
                    file,
                    title: file,
                };
            });
        }
    }

    public async readSuite(path: string, parseCases = true) {
        const dir = p.dirname(path);
        const suite = {} as any;
        const data = await fs.readFile(path);

        const $ = cheerio.load(data);
        const list = $('table a');
        suite.title = $('title').text();
        suite.file = path;
        const references = list.map((index, e) => {
            return p.join(dir, $(e).attr('href'));
        }).get();

        // only read cases when they are needed, otherwise only keep references
        suite.cases = await this.readCases(references, dir, parseCases);

        return suite;
    }

    public newSuite(title, path) {
        return {
            title: 'Test Suite',
            file: path,
            cases: [],
        };
    }

}
