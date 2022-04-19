# Markdown-it-attributes

Add classes, identifiers and attributes to your markdown with {} curly brackets, similar to pandoc's header attributes

An alternate of [markdown-it-attr](https://github.com/arve0/markdown-it-attrs), write by TypeScript, 132x faster!

Note: *Not support css-module and `hr` tag*.

**Benchmark**

```
node benchmark.js

simple content ---------- 100001 lines, 300000 characters
no plugin: 51ms
markdown-it-attrs: 183ms
markdown-it-attributes: 52ms
inc: 132x
complex content ---------- 290001 lines, 2668000 characters
no plugin: 393ms
markdown-it-attrs: 2321ms
markdown-it-attributes: 449ms
inc: 34.42857142857143x
compare result ----------
result equal: true
```

## Install

```sh
npm install --save markdown-it-attributes
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
