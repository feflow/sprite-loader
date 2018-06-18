'use strict';

const Parser = require('fastparse');

function handleBlockStart() {
    this.currEle = {};
    this.property = null;
    return 'property';
}

function handleWidthOrHeight(match, property, value, index) {
    this.currEle[property] = value;
    return 'property';
}

function handleBackground(match, property, p2, url, index) {
    this.property = property;
    this.currEle[property] = url;
    this.currEle.start = index;
    this.currEle.length = match.length;
    return 'property';
}

function handleBlockEnd() {
    if (this.property) {
        let keys = Object.keys(this.currEle);
        let item = {};
        for (let i = 0; i < keys.length; i++) {
            item[keys[i]] = this.currEle[keys[i]];
        }
        item.property = this.property;
        this.imgList.push(item);
    }
    return 'rule';
}

const description = {
    property: {
        "\\s+": true,
        "(width|height)\\s*:\\s*([0-9\\.]+px)": handleWidthOrHeight,

        "(background-image|background)\\s*:.*url\\((\"|')?(\\S+)\\?__sprite\\2[^;\\}]*(?:;|\\})": handleBackground,
        "\\}": handleBlockEnd
    },
    rule: {
        "\\/(\\*).*?\\1\\/": true,
        "\\{": handleBlockStart,
        "\\s+": true
    }
};

const parser = new Parser(description);
/**
 * parse css get need generator sprite
 * @param {String} css 
 * @return {Array} 
 */
module.exports = function parse(css) {
    let process = {
        currEle: {},
        property: null,
        imgList: []
    };
    return parser.parse('rule', css, process).imgList;
}