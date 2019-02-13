"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dot_1 = require("./dot");
const interpolate = (doc, data, formatters) => {
    const placeholders = findPlaceholders(doc);
    return computeUpdates(placeholders, data, formatters);
};
const findPlaceholders = (doc) => {
    const placeholders = [];
    doc.body.content.map(c => {
        if (c.paragraph) {
            c.paragraph.elements.map(e => {
                if (e.textRun) {
                    const matches = e.textRun.content.match(/{{([^}]*)}}/gi) || [];
                    matches.map(m => placeholders.push(m.slice(2, -2)));
                }
            });
        }
    });
    return placeholders;
};
const availableFormatters = {
    lowercase: (s) => s.toLowerCase(),
    uppercase: (s) => s.toUpperCase()
};
const computeUpdates = (placeholders, data, formatters) => {
    formatters = Object.assign({}, availableFormatters, formatters);
    const replacements = placeholders.map((placeholder) => {
        const computed = `${dot_1.default(data, placeholder, { formatters })}`;
        return [placeholder, computed];
    });
    return replacements.map(([placeholder, computed]) => ({
        replaceAllText: {
            replaceText: computed,
            containsText: {
                text: `{{${placeholder}}}`,
                matchCase: false
            }
        }
    }));
};
exports.default = interpolate;