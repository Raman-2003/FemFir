const Handlebars = require('handlebars');
const layouts = require('handlebars-layouts');

// Register custom Handlebars helpers
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('or', function () {
    // Convert the arguments object to a real array and remove the last argument (options)
    const args = Array.from(arguments).slice(0, -1);
    return args.some(Boolean); // Check if any argument is truthy
});

Handlebars.registerHelper('range', function (from, to, options) {
    let accum = '';
    for (let i = from; i <= to; ++i) {
        if (options.fn) {
            accum += options.fn({ index: i });
        } else {
            accum += i;
        }
    }
    return accum;
});

Handlebars.registerHelper('add', function (a, b) {
    return a + b;
});

Handlebars.registerHelper('subtract', function (a, b) {
    return a - b;
});

Handlebars.registerHelper('increment', (value) => value + 1);
Handlebars.registerHelper('decrement', (value) => value - 1);

Handlebars.registerHelper('range', (start, end) => {
    let array = [];
    for (let i = start; i <= end; i++) {
        array.push(i);
    }
    return array;
});

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('lt', (a, b) => a < b);

// Register the handlebars-layouts helpers
Handlebars.registerHelper(layouts(Handlebars));

// Custom date formatting helper
Handlebars.registerHelper('formatDate', function (dateString) {
    const date = new Date(dateString);
    return date.toDateString() + ' ' + date.toLocaleTimeString();
});

 // Helper function to calculate discounted price
 Handlebars.registerHelper('calculateDiscountedPrice', function(price, discountPercentage) {
    const discountedPrice = price - (price * (discountPercentage / 100));
    return discountedPrice.toFixed(2); // Adjust decimals as needed
});


module.exports = Handlebars;
