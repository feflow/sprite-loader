<h1 align="center">sprite-loader</h1>

<h2 align="center">Install</h2>

```bash
npm install --save-dev sprite-loader
```

<h2 align="center">Usage</h2>

**file.css**
```css 
  .image {
    background-image: url("./assets/images/example.png?__sprite");
    background-size: cover;
    overflow: hidden;
}
```
**file.js**
```js
import css from 'file.css';
```

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader', 'sprite-loader' ]
      }
    ]
  }
}
```

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`name`**|`{String}`|`sprite-[hash:6].png`|Configure a custom filename template for your file|
|**`context`**|`{String}`|`this.options.context`|Configure a custom file context, defaults to `webpack.config.js` [context](https://webpack.js.org/configuration/entry-context/#context)|
|**`outputPath`**|`{String\|Function}`|`Original images path`|Configure a custom `output` path for your files|