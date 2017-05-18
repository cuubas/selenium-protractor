var getters = {};

module.exports = {
    getters: getters,
    register: register,
    get: get
};

function register(type, fn, valueType, isMulti, inBrowserContext) {
    getters[type] = fn;
    fn.valueType = valueType || 'string';
    fn.isMulti = isMulti;
    fn.inBrowserContext = inBrowserContext;
}

function get(type, formatter) {
    var fn = getters[type && type.toLowerCase()] || getters['default'];
    if (arguments.length === 2) {
        return fn(type, formatter);
    } else {
        return fn;
    }
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
    return '.getSize().then(function (s){return s.width;})';
}, 'number');

register('elementheight', (value, formatter) => {
    return '.getSize().then(function (s){return s.height;})';
}, 'number');

register('elementpositionleft', (value, formatter) => {
    return '.getLocation().then(function (l){return l.x;})';
}, 'number');

register('elementpositiontop', (value, formatter) => {
    return '.getLocation().then(function (l){return l.y;})';
}, 'number');

register('elementheight', (value, formatter) => {
    return '.getSize().then(function (s){return s.height;})';
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