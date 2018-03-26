
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Spritesmith = require('spritesmith');
const loaderUtils = require('loader-utils');
const spritesmith = new Spritesmith();

module.exports = function(content) {
    let item, assets = [],
        imagesPathMap = [],
        callback = this.async(),
        resourcePath = this.resourcePath,
        options = loaderUtils.getOptions(this) || {},
        outputPath = options.outputPath,
        spriteImageRegexp = /url\((?:"|')(\S+)\?\_\_sprite(?:"|')\)/g,
        context =  options.context || this.rootContext || this.options && this.options.context,
        sourceRoot = path.dirname(path.relative(context, resourcePath));
        
    while((item = spriteImageRegexp.exec(content))) {
        if(item && item[1]) {
           let assetPath = loaderUtils.stringifyRequest(this, item[1]);
           let absolutePath = path.resolve(context, sourceRoot, JSON.parse(assetPath));
           assets.push(absolutePath);
           imagesPathMap.push({
               path: absolutePath,
               url: item[0]
           })
        }
    }

    if(!assets.length) {
        callback(null, content);
        return;
    }

    Spritesmith.run({src: assets}, function handleResult (err, result) {
        if(err) {
            callback(err, '');
            return;
        }
        let dirPath = path.dirname(assets[0]);
        if(outputPath) {
            outputPath = path.join(context, outputPath);
        }
        outputPath = outputPath || dirPath;
        mkdirp(outputPath, function(err) {
            if(err) {
                callback(err, '')
                return;
            }
            let name = options.name || 'sprite-[hash:6].png';
            let url = loaderUtils.interpolateName(this, name, {
                context,
                content: result.image
            });
    
            let spritesImgPath = path.join(outputPath, url);
            fs.writeFileSync(spritesImgPath, result.image);
            spriteImageRegexp.lastIndex = 0;
            let spriteRelativePath = path.relative(path.dirname(resourcePath), spritesImgPath);
            spriteRelativePath = loaderUtils.stringifyRequest(this, spriteRelativePath);
            spriteRelativePath = JSON.parse(spriteRelativePath);


            let match = null;
            let backgroundSize = 'background-size:' + result.properties.width + 'px ' + result.properties.height + 'px;';
            let lastIndex = 0;
            imagesPathMap.forEach(function(item) {
                
                let index = content.indexOf(item.url, lastIndex);
                let len = item.url.length;
                lastIndex = index + len;
               
                let preContent = content.substring(0, index);
                let afterContent = content.substring(index);
                let matchLength = len;
                let i;
                for(i = matchLength; i < afterContent.length; i++) {
                    if(afterContent.charAt(i) == ';' || afterContent.charAt(i) == '}') {
                        break;
                    }
                }

                let end;
                if(i < afterContent.length) {
                    if(afterContent[i] == ';') {
                        end = i + 1;
                        afterContent = afterContent.substring(0, end) + backgroundSize + afterContent.substring(end);
                    } else {
                        end = i;
                        afterContent = afterContent.substring(0, end) + ';\n' +  backgroundSize + afterContent.substring(end);
                    }
                    
                } 

                let absolutePathItem = item.path;
                let coordinates = result.coordinates;
                let image = coordinates[absolutePathItem];
                let cssVal = 'url("' + spriteRelativePath + '")' + ' -' + image.x + 'px' + ' -' + image.y + 'px';

                afterContent = cssVal + afterContent.substring(matchLength);
                content = preContent + afterContent;
                
            });

            callback(null, content);
        })
    });
    
}