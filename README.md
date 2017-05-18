# Selenium protractor
Selenium test case converter to protractor source code that can be required in any e2e test. Initially this was developed at Nordea to speed up creation of e2e tests.

## Structure
There are two commands to make better structure in the file:

* desc - creates `describe` block, value is used as description - locator is not needed
* it - created `it` block, value is used as description - locator is not needed

Neigher of them supports nesting though, but if it is needed - enddesc,endit (or similar) would have to be introduced. 
Each `it` block will close all previous blocks (except `desc`) that are created by various commands and each `desc` will close previous `desc` command (no nesting).

Alternatively, comments can be added instead of custom commands: 
Comment will be treated as `desc` command (only if next command in the list is a another comment or `it` command), otherwise as an `it` command.

if comment or `it` value start with `ide:`, all commands in that block will be ignored when parsing the html file. See login.html why this is useful.
if comment or `it` value starts with `skip:`, test case will be marked as skipped

## Flow
In some cases you need to skip or run certain commands depending on what the user sees

* breakIf - if condition specified in value is true, further commands in current `it` block will be skipped
* continueIf - if condition specified in value is true, further command in current `it` block will be executed, otherwises skipped

Condition is everything you would write in an if condition, e.g. myCount>0 or !modalVisible

Sometimes you want to have a single test case file, but would like to run another tests in between commands.

* callback - execute a function and run additional tests, e.g. data.myFn or data.myFn('param1'). Note that this command must be last command in an `it` block due to the nature of how tests are executed.

## Locator

Selenium ide with custom extensions should do pretty well.
Additionally you can also use stored variables for assertions for element itself or element child!
Some examples
* css=p
* e2etag=my-e2e-tag
* ${list}>>css=p will select p tags under previously located element
* e2etag=my-e2e-tag--${_date} (_date must be stored first)

## Interaction

* click
* type - enter text to an input field
* focus - scroll element into view
* submit
* scrollTo - scroll to given position e.g. 0,500 (500px from top). If no locator is set, document scroll will be adjusted
* scrollBy - scroll by given offset e.g. 0,250 (250px from current top). If no locator is set, document scroll will be adjusted
* eval - evaluate value as javascript, if locator is specified DOM node can be accessed via element variable
* storeEval - evaluate value as javascript and store it for later
* do we need all the events? e.g. keyDown, mousedown?

## Assertions
Actual testing can be done via following commands:

* assert* - will get appropriate value from the element and compare it to a given expression and will expect it to match
* assertNot * - will get appropriate value from the element and compare it to a given expression and will not expect it to match
* store* - will store the value in a variable for later use
* store - will store reference to an element in a variable, which could later be used as a selector or value
* verify* - not implemented, do we need them? The difference between assert and verify is that if the latter fails, test should not continue
* [assert|store]ElementPresent
* [assert|store]ElementEnabled
* [assert|store]ElementSelected
* [assert|store]ElementCount 
* [assert|store]scrollLeft
* [assert|store]scrollTop

The value can be checked in a few ways:

* text - will check if values are equal
* !text - will check if values are not equal (prefixing will always negate any comparison) - doesn't work in ide
* <2 - will check if value is less than 2, (input must be a number, e.g. assertCssCount) - doesn't work in ide
* >2 - will check if value is greater than 2 (input must be a number, e.g. assertCssCount) - doesn't work in ide
* ${myVariable} - will compare value to the variable. !<> modifiers will work as well.
* regexp:/foo/ - will use toMatch method to compare with given expression
* regexpi:/foo/ - will use toMatch method to compare with given expression. It will also add `i` (case insensitive) flag
* regexp:.*${name+'\-test'} - will result in `/.*foo\-test/` if name variable=foo and use toMatch method to compare
* regexpi:.*${name+'\-test'} - will result in `/.*foo\-test/i` if name variable=foo and use toMatch method to compare
* glob:*tes*t or just *tes*t - not implemented, but is default for selenium ide

# Usage
Command line:

`node index.js <glob> <destination> <path-to-suite>`

`node index.js in/**/*html out in/_selenium.suite`

Code:
```js
var transform = require('./test/e2e/selenium-protractor/index');
var suite = 'e2e/_source/_selenium.suite';
var glob = 'e2e/_source/**/*.html';
var destination = 'e2e/_generated';
var delta = false; // if you have a watcher, you can pass partial glob/path and this flag as true to only add what is missing in the test suite
transform(glob, destinationDir, suite, delta, (err) => {});
```
