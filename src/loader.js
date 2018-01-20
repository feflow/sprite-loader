
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Spritesmith = require('spritesmith');
var loaderUtils = require('loader-utils');
var spritesmith = new Spritesmith();

module.exports = function(content) {
    let item, assets = [],
        imagesPathMap = {},
        callback = this.async(),
        resourcePath = this.resourcePath,
        options = loaderUtils.getOptions(this) || {},
        outputPath = options.outputPath,
        spriteImageRegexp = /url\((?:"|')(\S+)\?\_\_sprite(?:"|')\)/g,
        context =  options.context || this.rootContext || this.options && this.options.context,
        sourceRoot = path.dirname(path.relative(context, resourcePath));
        
    while((item = spriteImageRegexp.exec(content))) {
        if(item && item[1]) {
           var assetPath = loaderUtils.stringifyRequest(this, item[1]);
           var absolutePath = path.resolve(context, sourceRoot, JSON.parse(assetPath));
           assets.push(absolutePath);
           imagesPathMap[item[1]] = absolutePath;
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
    
            var spritesImgPath = path.join(outputPath, url);
            fs.writeFileSync(spritesImgPath, result.image);
            spriteImageRegexp.lastIndex = 0;
            let spriteRelativePath = path.relative(path.dirname(resourcePath), spritesImgPath);
            spriteRelativePath = loaderUtils.stringifyRequest(this, spriteRelativePath);
            spriteRelativePath = JSON.parse(spriteRelativePath);

            content = content.replace(spriteImageRegexp, function(match, p1) {
                var absolutePathItem = imagesPathMap[p1];
                var coordinates = result.coordinates;
                var image = coordinates[absolutePathItem];
                var cssVal = 'url("' + spriteRelativePath + '")' + ' -' + image.x + 'px' + ' -' + image.y + 'px';
                return cssVal;
            })
            callback(null, content);
        })
    });
    
}