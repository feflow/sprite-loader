'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Spritesmith = require('spritesmith');
const loaderUtils = require('loader-utils');


const spriteUrlPattern = /url\((?:"|')?(\S+)\?__sprite(?:"|')?\)/;

const helper = require('./helper');
const parser = require('./parser');

const getSpriteRequest = helper.getSpriteRequest;
const needAddSemicolon = helper.needAddSemicolon;

module.exports = function(content) {
    let assets = [],
        callback = this.async(),
        resourcePath = this.resourcePath,
        options = loaderUtils.getOptions(this) || {},
        outputPath = options.outputPath,
        context = options.context || this.rootContext || this.options && this.options.context,
        sourceRoot = path.dirname(path.relative(context, resourcePath));
    let res = parser(content);
    if (!Array.isArray(res) || !res.length) {
        callback(null, content);
        return;
    }

    for (let i = 0; i < res.length; i++) {
        let property = res[i].property;
        let urlPath = res[i][property];

        let assetPath = loaderUtils.stringifyRequest(this, urlPath);
        let absolutePath = path.resolve(context, sourceRoot, JSON.parse(assetPath));
        assets.push(absolutePath);
        res[i]['absolutePath'] = absolutePath;
    }

    if (!assets.length) {
        callback(null, content);
        return;
    }



    Spritesmith.run({ src: assets }, function handleResult(err, result) {
        if (err) {
            callback(err);
            return;
        }
        let dirPath = path.dirname(assets[0]);
        if (outputPath) {
            outputPath = path.join(context, outputPath);
        }
        outputPath = outputPath || dirPath;

        mkdirp(outputPath, function(err) {
            if (err) {
                callback(err)
                return;
            }

            let spriteOutputPath = helper.getSpriteOutputPath(context, outputPath, options.name, result.image);

            fs.writeFileSync(spriteOutputPath, result.image);

            let spriteImageWidth = result.properties.width,
                spriteImageHeight = result.properties.height;

            function spriteCodeGenerator(
                spriteImage,
                eleWidth,
                eleHeight,
                needWidth,
                needHeight) {
                eleWidth = parseFloat(eleWidth);
                eleHeight = parseFloat(eleHeight);

                let widthScale = eleWidth / spriteImage.width;
                let heightScale = eleHeight / spriteImage.height;

                let propertyValueMap = [];

                propertyValueMap.push({
                    property: 'background-size',
                    value: `${widthScale * spriteImageWidth}px ${heightScale * spriteImageHeight}px`
                });

                propertyValueMap.push({
                    property: 'background-position',
                    value: `-${spriteImage.x * widthScale}px -${spriteImage.y * widthScale}px`
                })

                if (needWidth) {
                    propertyValueMap.push({
                        property: 'width',
                        value: `${eleWidth}px`
                    });
                }
                if (needHeight) {
                    propertyValueMap.push({
                        property: 'height',
                        value: `${eleHeight}px`
                    });
                }

                return propertyValueMap.map((item) => {
                    return `${item.property}:${item.value};\n`;
                }).join('');

            }

            let generatorContent = [content];

            for (let index = res.length - 1; index >= 0; index--) {
                let absolutePath = res[index].absolutePath,
                    coordinates = result.coordinates,
                    spriteImage = coordinates[absolutePath],
                    eleWidth = res[index].width || spriteImage.width,
                    eleHeight = res[index].height || spriteImage.height,
                    needWidth = !res[index].width,
                    needHeight = !res[index].height;

                let spriteCode = spriteCodeGenerator(spriteImage, eleWidth, eleHeight, needWidth, needHeight);
                content = generatorContent.shift();

                let currMatchStart = res[index].start,
                    currMatchLength = res[index].length;
                let currMatchContentAfter = content.substring(currMatchStart + currMatchLength),
                    currMatchContent = content.substr(currMatchStart, currMatchLength),
                    currMatchContentBefore = content.substring(0, currMatchStart);
                generatorContent.unshift(currMatchContentAfter);

                let spriteRequest = getSpriteRequest(context, resourcePath, spriteOutputPath);
                currMatchContent = currMatchContent.replace(spriteUrlPattern, () => {
                    return `url("${spriteRequest}")`;
                })

                if (needAddSemicolon(currMatchContent)) {
                    spriteCode = ';' + spriteCode;
                }
                generatorContent.unshift(spriteCode);
                generatorContent.unshift(currMatchContent);
                generatorContent.unshift(currMatchContentBefore);
            }
            callback(null, generatorContent.join(''));
        })
    });

}