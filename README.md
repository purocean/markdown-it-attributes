# Markdown-it-attributes

Add classes, identifiers and attributes to your markdown with {} curly brackets, similar to pandoc's header attributes

An alternate of [markdown-it-attr](https://github.com/arve0/markdown-it-attrs), write by TypeScript, 67x faster!

Note: *Not support css-module and `hr` tag*.

Test of 100000 lines, 350000 characters simple and large file. 67x faster!

**Before: markdown-it-attrs**

<img width="775" alt="before" src="https://user-images.githubusercontent.com/7115690/163722498-9b1be126-a82b-4d4c-995c-94f8431b3744.png">

**After: markdown-it-attributes**

<img width="775" alt="after" src="https://user-images.githubusercontent.com/7115690/163722482-eda06281-af6c-4158-9419-d93b3505cb90.png">

**Benchmark**

more complex content. 32x faster!

```
node benchmark.js

no plugin: 483ms
markdown-it-attrs test1: 2358ms
markdown-it-attributes test1: 542ms
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
