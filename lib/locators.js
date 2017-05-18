var locators = {};

module.exports = {
    locators: locators,
    get: locator,
    register: registerLocator
};

function registerLocator(type, fn) {
    locators[type] = fn;
}

function locator(input, formatter, isMulti) {
    var res;
    if (input.indexOf('$') === 0) {
        var end = input.indexOf('}')
        var res = input.substring(2, end);
        if (end < input.length - 1) {
            input = input.substring(end + 1);
            // nested locators
            if (input.indexOf('>>') === 0) {
                input = input.substring(2);
            }
            res += '.' + locator(input, formatter, isMulti);
        }
    } else if (input.indexOf('=') === -1 || input.indexOf('/') === 0) {
        res = locators['default'](input, formatter);
    } else {

        var splits = input.split('=');
        var type = splits.shift();
        res = (locators[type] || locators['default'])(splits.join('='), formatter);
    }
    if (isMulti) {
        res = res.replace(/element\(/g, 'element.all(');
        res = res.replace(/.element.all\(/g, '.all(');
    }
    return res;
}

// supported locators
registerLocator('default', (locator, formatter) => {
    return "element(by.xpath(" + formatter.quote(locator, true) + "))";
});
// standard selectors supported by protractor
['binding', 'exactBinding', 'model', 'buttonText', 'partialButtonText', 'repeater', 'exactRepeater', 'cssContainingText', 'deepCss', 'className', 'id', 'linkText', 'js', 'name', 'partialLinkText', 'tagName', 'xpath'].forEach((type) => {
    registerLocator(type, (locator, formatter) => {
        return "element(by." + type + "(" + formatter.quote(locator, true) + "))";
    });
});
registerLocator('css', (locator, formatter) => {
    var CONTAINS_START = /\:contains\(['"]/,
        CONTAINS_END = /["']\)/,
        CONTAINS_LENGTH = ':contains("'.length,
        containsStartIndex = locator.search(CONTAINS_START),
        containsEndIndex = locator.search(CONTAINS_END),
        text,
        innerSelect,
        result;
    if (containsStartIndex !== -1 && containsEndIndex !== -1) {
        text = locator.trim().substring(containsStartIndex + CONTAINS_LENGTH, containsEndIndex);
        innerSelect = locator.substr(containsEndIndex + 2).trim();
        result = "element(by.cssContainingText(" + formatter.quote(locator.substr(0, containsStartIndex), true) + ", " + formatter.quote(text, true) + "))";
        if (innerSelect) {
            result += '.' + locators['css'](innerSelect, formatter);
        }
    } else {
        result = "element(by.css(" + formatter.quote(locator, true) + "))";
    }
    return result;
});

// custom ones
registerLocator('click', (locator, formatter) => {
    return "element(by.css(`[ng-click=" + formatter.quote(locator) + "]`))";
});
registerLocator('href', (locator, formatter) => {
    return "element(by.css(`[href=" + formatter.quote(locator) + "]`))";
});