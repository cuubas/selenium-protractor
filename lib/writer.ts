var fs = require('fs');
var p = require('path');
var mkpath = require('mkpath');

var async = require('async');

function Writer(testCaseFormatter, testSuiteFormatter) {
  this.testCaseFormatter = testCaseFormatter;
  this.testSuiteFormatter = testSuiteFormatter;
}

Writer.prototype.transformAndSaveCases = function (cases, destination, callback) {
  async.each(cases, (testCase, cb) => {
    this.saveCase(testCase, this.caseDestinationPath(testCase.file, destination), cb);
  }, callback);
};

Writer.prototype.caseDestinationPath = function (casePath, destination) {
  return p.join(destination, casePath.replace('.html', '.js'));
};


Writer.prototype.saveCase = function (testCase, path, callback) {
  mkpath(p.dirname(path), (err) => {
    if (err) {
      callback(err);
    } else {
      fs.writeFile(path, this.testCaseFormatter.stringify(testCase), callback);
    }
  });
};

Writer.prototype.saveSuite = function (suite, path, callback) {
  mkpath(p.dirname(path), (err) => {
    if (err) {
      callback(err);
    } else {
      fs.writeFile(path, this.testSuiteFormatter.stringify(suite), callback);
    }
  });
};
module.exports = Writer;
