import { get as locator } from './locators';
import { TestCaseCommand } from './model';
import { TestCaseFormatter } from './test-case-formatter';

export type ValueType = 'string' | 'number' | 'boolean';

export type AccessorFnBase = ((value: string, formatter: TestCaseFormatter) => string);

export type AccessorFn = AccessorFnBase & {
    type: string;
    valueType: ValueType;
    isMulti: boolean;
    inBrowserContext: boolean;
    isGlobal: boolean;
};

export const accessors: { [type: string]: AccessorFn } = {};

export function register(type: string, fn: AccessorFnBase, valueType?: ValueType, isMulti?: boolean, inBrowserContext?: boolean, global?: boolean) {
    accessors[type] = fn as AccessorFn;
    accessors[type].valueType = valueType || 'string';
    accessors[type].isMulti = isMulti;
    accessors[type].inBrowserContext = inBrowserContext;
    accessors[type].isGlobal = global;
}
export function get(type: string): AccessorFn;
export function get(type: string, formatter: TestCaseFormatter): string;
export function get(type: string, formatter?: TestCaseFormatter) {
    const fn = accessors[type && type.toLowerCase()] || accessors['default'];
    if (arguments.length === 2) {
        return fn(type, formatter);
    } else {
        return fn;
    }
}

export function format(type: string, cmd: TestCaseCommand, formatter: TestCaseFormatter, output: string[]) {
    const getter = get(type);
    // special case for attribute accessor
    if (type === 'attribute') {
        const parts = cmd.locator.split('@');
        type = parts.pop();
        cmd.locator = parts.join('@');
    }
    if (getter.isGlobal) {
        output.push('browser' + getter(cmd.locator, formatter) + '.then((_value) => {' + formatter.endOfLine);
    } else if (getter.inBrowserContext && !cmd.locator) {
        // executeAsyncScript passes callback as last argument, thus arguments[arguments.length - 1]
        // tslint:disable-next-line:max-line-length
        output.push(`browser.executeAsyncScript('arguments[arguments.length - 1](document.documentElement` + getter(type, formatter) + ` || document.body` + getter(type, formatter) + `)')` + `.then((_value) => {` + formatter.endOfLine);
    } else if (getter.inBrowserContext) {
        // executeAsyncScript passes callback as last argument, thus arguments[arguments.length - 1]
        // tslint:disable-next-line:max-line-length
        output.push(`browser.executeAsyncScript('arguments[arguments.length - 1](arguments[0]` + getter(type, formatter) + `)', ` + locator(cmd.locator, formatter) + `.getWebElement())` + `.then((_value) => {` + formatter.endOfLine);
    } else {
        output.push(locator(cmd.locator, formatter, getter.isMulti) + getter(type, formatter) + `.then((_value) => {` + formatter.endOfLine);
    }
    return getter;
}

register('default', (value, formatter) => {
    return value ? '.getAttribute("' + value + '")' : '';
});

register('attribute', (value, formatter) => {
    return value ? '.getAttribute("' + value + '")' : '';
});

register('value', (value, formatter) => {
    return '.getAttribute("value")';
});

register('text', (value, formatter) => {
    return '.getText()';
});

register('elementwidth', (value, formatter) => {
    return '.getSize().then(s => s.width)';
}, 'number');

register('elementheight', (value, formatter) => {
    return '.getSize().then(s => s.height)';
}, 'number');

register('elementpositionleft', (value, formatter) => {
    return '.getLocation().then(l => l.x)';
}, 'number');

register('elementpositiontop', (value, formatter) => {
    return '.getLocation().then(l => l.y)';
}, 'number');

register('elementheight', (value, formatter) => {
    return '.getSize().then(s => s.height)';
}, 'number');

register('elementpresent', (value, formatter) => {
    return '.isPresent()';
}, 'boolean');

register('visible', (value, formatter) => {
    return '.isDisplayed()';
}, 'boolean');

register('elementenabled', (value, formatter) => {
    return '.isEnabled()';
}, 'boolean');

register('elementselected', (value, formatter) => {
    return '.isSelected()';
}, 'boolean');

register('elementcount', (value, formatter) => {
    return '.count()';
}, 'number', true);

register('csscount', (value, formatter) => {
    return '.count()';
}, 'number', true);

// 'native' properties
['scrollTop', 'scrollLeft'].forEach((prop) => {
    register(prop.toLowerCase(), (value, formatter) => {
        return '.' + prop;
    }, 'number', false, true);
});

register('location', (value, formatter) => {
    return '.getCurrentUrl()';
}, 'string', false, false, true);

register('title', (value, formatter) => {
    return '.getTitle()';
}, 'string', false, false, true);

register('eval', (value, formatter) => {
    return '.executeAsyncScript(\'arguments[arguments.length - 1](\' + ' + formatter.quote(value, true) + ' + \')\')';
}, 'string', false, false, true);
