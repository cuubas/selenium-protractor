var fs = require('fs');
var p = require('path');
var mkpath = require('mkpath');
var handlers = require('./handlers').handlers;
var locators = require('./locators').locators;

var async = require('async');

function Formatter(options) {
    this.options = options || {};
    this.endOfLine = this.options.endOfLine || require('os').EOL;
    this.whitespace = this.options.whitespace || '  ';
}

Formatter.prototype.indent = function (num) {
    return this.whitespace.repeat(num);
};

Formatter.prototype.stringifyCommand = function (cmd) {
    return cmd.type + '|' + cmd.locator + '|' + cmd.value;
};

Formatter.prototype.quote = function (v, withVariables) {
    if (withVariables) {
        return v ? '`' + v.replace(/`/g, '\\\`') + '`' : '\'\'';
    } else {
        return v ? '\'' + v.replace(/'/g, '\\\'') + '\'' : '\'\'';
    }
};

Formatter.prototype.expression = function (v) {
    if (v && v.indexOf('${') === 0 && v.indexOf('}') === v.length - 1) {
        return v.trim().substring(2, v.length - 1);
    } else {
        return v ? '`' + v.replace(/`/g, '\\`') + '`' : '\'\'';
    }
};

Formatter.prototype.transformAndSaveCases = function (cases, destination, callback) {
    async.each(cases, (testCase, cb) => {
        this.saveCase(testCase, this.caseDestinationPath(testCase.file, destination), cb);
    }, callback);
};

Formatter.prototype.caseDestinationPath = function (casePath, destination) {
    return p.join(destination, casePath.replace('.html', '.js'));
};

Formatter.prototype.formatCase = function (testCase) {
    var content = [];
    var variables = [];
    var indentLevel = 0;
    var standardIndentLevel = 0;
    var inDescBlock = false;
    var self = this;
    var noDescOrExportCommand = true;
    push('\'use strict\'');
    push(this.endOfLine);

    // handle variables
    testCase.commands.forEach((cmd, index) => {
        // all store commands will create a new variable that can be used in locators or comparison
        if (cmd.value && cmd.type.indexOf('store') === 0 && variables.indexOf(cmd.value) === -1 && cmd.value.indexOf('data.') === -1) {
            variables.push(cmd.value);
        }
        if (cmd.type === handlers.desc.type || cmd.type === handlers.export.type) {
            noDescOrExportCommand = false;
        }
    });
    // in case desc or export command is not used, define variables in top most scope
    if (noDescOrExportCommand && variables.length > 0) {
        push("var " + variables.join(', ') + ';' + this.endOfLine.repeat(2));
    }
    // do we return a function or just run once?
    if (testCase.commands.length && testCase.commands[0].type === handlers.export.type) {
        standardIndentLevel++;
    }
    testCase.commands.forEach((cmd) => {
        var handler = getHandler(cmd);
        var res = handler(cmd, this);

        // handle multiple desc commands
        if (handler.type === handlers.desc.type) {
            if (inDescBlock) {
                standardIndentLevel--;
            }
            closeIfNeeded(standardIndentLevel);
            standardIndentLevel++;
            inDescBlock = true;
        }
        // should close the block if needed
        if (handler.closeBlockBefore) {
            closeIfNeeded(standardIndentLevel);
        }

        if (Array.isArray(res)) {
            res.forEach(push);
        } else {
            push(res);
        }
        if (handler.scoped) {
            indentLevel++;
        }
        // variables should be declared inside first desc block or export block
        if (variables.length > 0 && (handler.type === handlers.desc.type || handler.type === handlers.export.type)) {
            push("var " + variables.join(', ') + ';' + this.endOfLine.repeat(2));
            variables = [];
        }
    });

    closeIfNeeded(0);

    return content.join('');

    function getHandler(cmd) {
        var handler = handlers[cmd.type.toLowerCase()];
        if (!handler) {
            if (cmd.type.indexOf('assert') === 0) {
                handler = handlers['defaultassert'];
            } else if (cmd.type.indexOf('store') === 0) {
                handler = handlers['defaultstore'];
            } else if (cmd.type.indexOf('verify') === 0) {
                handler = handlers['defaultverify'];
            } else {
                handler = handlers['default']
            }
        }
        return handler;
    }

    function push(v) {
        content.push(self.indent(indentLevel) + v);
    }

    function closeIfNeeded(toLevel) {
        while (indentLevel > toLevel) {
            indentLevel--;
            push('});' + self.endOfLine.repeat(2));
        }
    }
};

Formatter.prototype.formatSuite = function (suite) {
    var rows = suite.cases.map((testCase) => {
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
};

Formatter.prototype.saveCase = function (testCase, path, callback) {
    mkpath(p.dirname(path), (err) => {
        if (err) {
            callback(err);
        } else {
            fs.writeFile(path, this.formatCase(testCase), callback);
        }
    });
};

Formatter.prototype.saveSuite = function (suite, path, callback) {
    mkpath(p.dirname(path), (err) => {
        if (err) {
            callback(err);
        } else {
            fs.writeFile(path, this.formatSuite(suite), callback);
        }
    });
};
module.exports = Formatter;
