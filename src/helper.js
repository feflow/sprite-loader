const path = require('path');
const loaderUtils = require('loader-utils');

const spacePattern = /[^ ]*\s$/;
const commentPattern = /\*((?!\*).|\n)+\*$/;
const semicolonPattern = /;$/;
const closeCurly = /\}$/;

/**
 * 
 * @param {Object} context 
 * @param {String} resourcePath 
 * @param {String} spritesImgPath 
 */

function getSpriteRequest(context, resourcePath, spritesImgPath) {
    let resPathDirname = path.dirname(resourcePath),
        spriteRelativePath = path.relative(resPathDirname, spritesImgPath);

    spriteRelativePath = loaderUtils.stringifyRequest(context, spriteRelativePath)
    return JSON.parse(spriteRelativePath);
}

function getSpriteOutputPath(context, outputDir, name, content) {
    name = name || 'sprite-[hash:6].png';
    let interpolateName = loaderUtils.interpolateName(this, name, {
        context,
        content
    });

    return path.join(outputDir, interpolateName);
}

function advance(content, step) {
    return content.slice(0, -step);
}

function needAddSemicolon(content) {
    if (commentPattern.test(content)) {
        content = advance(content, commentPattern.lastIndex);
    }

    if (spacePattern.test(content)) {
        content = advance(content, spacePattern.lastIndex);
    }

    if (semicolonPattern.test(content)) {
        return false;
    }

    if (closeCurly.test(content)) {
        return true;
    }

    return true;

}

module.exports = {
    needAddSemicolon: needAddSemicolon,
    getSpriteRequest: getSpriteRequest,
    getSpriteOutputPath: getSpriteOutputPath
};