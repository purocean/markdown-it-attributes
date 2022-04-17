# Markdown-it-attributes

Add classes, identifiers and attributes to your markdown with {} curly brackets, similar to pandoc's header attributes

An alternate of [markdown-it-attr](https://github.com/arve0/markdown-it-attrs), write by typescript, 3x faster.

Note: Not support css-module and `hr` tag.

```
node  benchmark.js

markdown-it-attrs test1: 1897ms
markdown-it-attributes test1: 532ms
result equal: true
```

## Install

```sh
npm install --save markdown-it-attrs
```

## Usage

```js
var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attributes');

md.use(markdownItAttrs, {
  // optional, these are default options
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: []  // empty array = all attributes are allowed
});

var src = '# header {.green #id}\nsome text {with=attrs and="attrs with space"}';
var res = md.render(src);

console.log(res);
```
