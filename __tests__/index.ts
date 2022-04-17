/* eslint-disable @typescript-eslint/no-var-requires */
// some test case from https://github.com/arve0/markdown-it-attrs/blob/master/test.js

import * as lib from '@/index';
const Markdown = require('markdown-it');
const implicitFigures = require('markdown-it-implicit-figures');
const katex = require('markdown-it-katex');

const md = Markdown({});
md.use(lib.default, {});

test('parseToken', () => {
  expect(lib.parseToken({ content: '{foo}bar' })).toEqual({ pos: 1, exp: 'foo', text: 'bar' });
  expect(lib.parseToken({ content: 'abc{foo}' })).toEqual({ pos: 2, exp: 'foo', text: 'abc' });
  expect(lib.parseToken({ content: 'abc {foo}' })).toEqual({ pos: 2, exp: 'foo', text: 'abc' });
  expect(lib.parseToken({ content: 'abc\n{foo}' })).toEqual({ pos: 2, exp: 'foo', text: 'abc' });
  expect(lib.parseToken({ content: 'ab{c{foo}' })).toEqual({ pos: 2, exp: 'foo', text: 'ab{c' });
  expect(lib.parseToken({ content: '{foo}}' })).toEqual({ pos: 1, exp: 'foo', text: '}' });
  expect(lib.parseToken({ content: '{{foo}' })).toEqual({ pos: 2, exp: 'foo', text: '{' });
  expect(lib.parseToken({ content: '{foo}' })).toEqual({ pos: 0, exp: 'foo', text: '', });
  expect(lib.parseToken({ content: '' })).toEqual(null);
  expect(lib.parseToken({ content: '}' })).toEqual(null);
  expect(lib.parseToken({ content: '{' })).toEqual(null);
  expect(lib.parseToken({ content: '{}' })).toEqual(null);
  expect(lib.parseToken({ content: 'abc' })).toEqual(null);
});

test('parseAttr', () => {
  expect(lib.parseAttr('')).toEqual(null);
  expect(lib.parseAttr('.')).toEqual(null);
  expect(lib.parseAttr('=')).toEqual(null);
  expect(lib.parseAttr('foo=')).toEqual(null);
  expect(lib.parseAttr('.foo')).toEqual({ key: 'class', value: ['foo'] });
  expect(lib.parseAttr('.foo..bar')).toEqual({ key: 'class', value: ['foo', 'bar'] });
  expect(lib.parseAttr('#')).toEqual(null);
  expect(lib.parseAttr('#foo')).toEqual({ key: 'id', value: ['foo'] });
  expect(lib.parseAttr('foo')).toEqual({ key: 'foo', value: [''] });
  expect(lib.parseAttr('a0')).toEqual({ key: 'a0', value: [''] });
  expect(lib.parseAttr('0')).toEqual(null);
  expect(lib.parseAttr('a=b')).toEqual({ key: 'a', value: ['b'] });
  expect(lib.parseAttr('a=\'b\'')).toEqual({ key: 'a', value: ['b'] });
  expect(lib.parseAttr('a=\'b"\'')).toEqual({ key: 'a', value: ['b"'] });
  expect(lib.parseAttr('a="b"')).toEqual({ key: 'a', value: ['b'] });
  expect(lib.parseAttr('a="b c"')).toEqual({ key: 'a', value: ['b c'] });
  expect(lib.parseAttr('a=\'b c\'')).toEqual({ key: 'a', value: ['b c'] });
  expect(lib.parseAttr('a="b\'"')).toEqual({ key: 'a', value: ['b\''] });
  expect(lib.parseAttr('0a=b')).toEqual(null);
});

test('getAttrs', () => {
  expect(lib.getAttrs('')).toEqual([]);
  expect(lib.getAttrs('.')).toEqual([]);
  expect(lib.getAttrs('=')).toEqual([]);
  expect(lib.getAttrs('a="b c"')).toEqual([{ key: 'a', value: ['b c'] }]);
  expect(lib.getAttrs('foo=')).toEqual([]);
  expect(lib.getAttrs('.foo')).toEqual([{ key: 'class', value: ['foo'] }]);
  expect(lib.getAttrs('.foo..bar #123 w 0 - 0a=c  a=b c="d" e=\'f\' g="h i"')).toEqual([
    { key: 'class', value: ['foo', 'bar'] },
    { key: 'id', value: ['123'] },
    { key: 'w', value: [''] },
    { key: 'a', value: ['b'] },
    { key: 'c', value: ['d'] },
    { key: 'e', value: ['f'] },
    { key: 'g', value: ['h i'] },
  ]);
});

test('should add attributes when {} in end of last inline', () => {
  const src = 'some text {with=attrs}';
  const expected = '<p with="attrs">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add attributes when {} in end of last inline: class', () => {
  const src = 'some text {.abc.d..e class=attrs}';
  const expected = '<p class="abc d e attrs">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should not add attributes when it has too many delimiters {{}}', () => {
  const src = 'some text {{with=attrs}}';
  const expected = '<p>some text {{with=attrs}}</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add attributes when {} in last line', () => {
  const src = 'some text\n{with=attrs}';
  const expected = '<p with="attrs">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add attributes when {} in last line', () => {
  const src = 'some text\n{with=attrs}';
  const expected = '<p with="attrs">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add classes with {.class} dot notation', () => {
  const src = 'some text {.green}';
  const expected = '<p class="green">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add identifiers with {#id} hashtag notation', () => {
  const src = 'some text {#section2}';
  const expected = '<p id="section2">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should support attributes inside " {attr="lorem ipsum"}', () => {
  const src = 'some text {attr="lorem ipsum"}';
  const expected = '<p attr="lorem ipsum">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add classes in same class attribute {.c1 .c2} -> class="c1 c2"', () => {
  const src = 'some text {.c1 .c2}';
  const expected = '<p class="c1 c2">some text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should support empty inline tokens', () => {
  const src = ' 1 | 2 \n --|-- \n a | ';
  md.render(src); // should not crash / throw error
});

test('should add classes to inline elements', () => {
  const src = 'paragraph **bold**{.red} asdf';
  const expected = '<p>paragraph <strong class="red">bold</strong> asdf</p>\n';
  const tokens = md.parse(src);
  console.log(tokens);
  expect(md.render(src)).toEqual(expected);
});

test('should not add classes to inline elements with too many {{}}', () => {
  const src = 'paragraph **bold**{{.red}} asdf';
  const expected = '<p>paragraph <strong>bold</strong>{{.red}} asdf</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should only remove last {}', () => {
  const src = '{{.red}';
  const expected = '<p class="red">{</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add classes for list items', () => {
  const src = '- item 1{.red}\n- item 2';
  let expected = '<ul>\n';
  expected += '<li class="red">item 1</li>\n';
  expected += '<li>item 2</li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add classes in nested lists', () => {
  let src = '- item 1{.a}\n';
  src += '  - nested item {.b}\n';
  src += '  {.c}\n';
  src += '    1. nested nested item {.d}\n';
  src += '    {.e}\n';
  // Adding class to top ul not supported
  //    src += '{.f}';
  //    expected = '<ul class="f">\n';
  let expected = '<ul>\n';
  expected += '<li class="a">item 1\n';
  expected += '<ul class="c">\n';
  expected += '<li class="b">nested item\n';
  expected += '<ol class="e">\n';
  expected += '<li class="d">nested nested item</li>\n';
  expected += '</ol>\n';
  expected += '</li>\n';
  expected += '</ul>\n';
  expected += '</li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should work with nested inline elements', () => {
  const src = '- **bold *italics*{.blue}**{.green}';
  let expected = '<ul>\n';
  expected += '<li><strong class="green">bold <em class="blue">italics</em></strong></li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add class to inline code block', () => {
  const src = 'bla `click()`{.c}';
  const expected = '<p>bla <code class="c">click()</code></p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should not trim unrelated white space', () => {
  const src = '- **bold** text {.red}';
  let expected = '<ul>\n';
  expected += '<li class="red"><strong>bold</strong> text</li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should not create empty attributes', () => {
  const src = 'text { .red }';
  const expected = '<p class="red">text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add attributes to ul when below last bullet point', () => {
  const src = '- item1\n- item2\n{.red}';
  const expected = '<ul class="red">\n<li>item1</li>\n<li>item2</li>\n</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add classes for both last list item and ul', () => {
  const src = '- item{.red}\n{.blue}';
  let expected = '<ul class="blue">\n';
  expected += '<li class="red">item</li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should add class ul after a "softbreak"', () => {
  const src = '- item\n{.blue}';
  let expected = '<ul class="blue">\n';
  expected += '<li>item</li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should ignore non-text "attr-like" text after a "softbreak"', () => {
  const src = '- item\n*{.blue}*';
  let expected = '<ul>\n';
  expected += '<li>item\n<em>{.blue}</em></li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should work with ordered lists', () => {
  const src = '1. item\n{.blue}';
  let expected = '<ol class="blue">\n';
  expected += '<li>item</li>\n';
  expected += '</ol>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should work with typography enabled', () => {
  const src = 'text {key="val with spaces"}';
  const expected = '<p key="val with spaces">text</p>\n';
  const res = md.set({ typographer: true }).render(src);
  expect(res).toEqual(expected);
});

test('should support code blocks', () => {
  const src = '```{.c a=1 #ii}\nfor i in range(10):\n```';
  const expected = '<pre><code class="c" a="1" id="ii">for i in range(10):\n</code></pre>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should support code blocks with language defined', () => {
  const src = '```python {.c a=1 #ii}\nfor i in range(10):\n```';
  const expected = '<pre><code class="c language-python" a="1" id="ii">for i in range(10):\n</code></pre>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should support blockquotes', () => {
  const src = '> quote\n{.c}';
  const expected = '<blockquote class="c">\n<p>quote</p>\n</blockquote>\n';
  expect(md.render(src)).toEqual(expected);
});

//     test('should support tables', () => {
//       const src = '| h1 | h2 |\n';
//       src const += '| -- | -- |\n';
//       src += '| c1 | c1 |\n';
//       src += '\n';
//       src += '{.c}';
//       expected = '<table class="c">\n';
//       expected += '<thead>\n';
//       expected += '<tr>\n';
//       expected += '<th>h1</th>\n';
//       expected += '<th>h2</th>\n';
//       expected += '</tr>\n';
//       expected += '</thead>\n';
//       expected += '<tbody>\n';
//       expected += '<tr>\n';
//       expected += '<td>c1</td>\n';
//       expected += '<td>c1</td>\n';
//       expected += '</tr>\n';
//       expected += '</tbody>\n';
//       expected += '</table>\n';
//       expect(md.render(src)).toEqual(expected);
//     });

test('should support nested lists', () => {
  let src = '- item\n';
  src += '  - nested\n';
  src += '  {.red}\n';
  src += '\n';
  src += '{.blue}\n';
  let expected = '<ul class="blue">\n';
  expected += '<li>item\n';
  expected += '<ul class="red">\n';
  expected += '<li>nested</li>\n';
  expected += '</ul>\n';
  expected += '</li>\n';
  expected += '</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should support images', () => {
  const src = '![alt](img.png){.a}';
  const expected = '<p><img src="img.png" alt="alt" class="a"></p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should work with plugin implicit-figures', () => {
  const _md = Markdown({}).use(lib.default).use(implicitFigures);
  const src = '![alt](img.png){.a}';
  const expected = '<figure><img src="img.png" alt="alt" class="a"></figure>\n';
  expect(_md.render(src)).toEqual(expected);
});

test('should work with plugin katex', () => {
  const _md = Markdown({}).use(lib.default).use(katex);
  const mdWithOnlyKatex = Markdown({}).use(katex);
  const src = '$\\sqrt{a}$';
  expect(_md.render(src)).toEqual(mdWithOnlyKatex.render(src));
});

test('should not apply inside `code{.red}`', () => {
  const src = 'paragraph `code{.red}`';
  const expected = '<p>paragraph <code>code{.red}</code></p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should not apply inside item lists with trailing `code{.red}`', () => {
  const src = '- item with trailing `code = {.red}`';
  const expected = '<ul>\n<li>item with trailing <code>code = {.red}</code></li>\n</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should not apply inside item lists with trailing non-text, eg *{.red}*', () => {
  const src = '- item with trailing *{.red}*';
  const expected = '<ul>\n<li>item with trailing <em>{.red}</em></li>\n</ul>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should work with multiple inline code blocks in same paragraph', () => {
  const src = 'bla `click()`{.c} blah `release()`{.cpp}';
  const expected = '<p>bla <code class="c">click()</code> blah <code class="cpp">release()</code></p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should support {} curlies with length == 3', () => {
  const src = 'text {a}';
  const expected = '<p a="">text</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should do nothing with empty classname {.}', () => {
  const src = 'text {.}';
  const expected = '<p>text {.}</p>\n';
  expect(md.render(src)).toEqual(expected);
});

test('should do nothing with empty id {#}', () => {
  const src = 'text {#}';
  const expected = '<p>text {#}</p>\n';
  expect(md.render(src)).toEqual(expected);
});

// test('should support horizontal rules ---{#id}', () => {
//   const src = '---{#id}';
//   const expected = '<hr id="id">\n';
//   expect(md.render(src)).toEqual(expected);
// });

//     it('should restrict attributes by allowedAttributes (string)', () => {
//       md = Md().use(attrs, Object.assign({ allowedAttributes: ['id', 'class'] }, options));
//       const src = 'text {.someclass #someid attr=notAllowed}';
//       const expected = '<p class="someclass" id="someid">text</p>\n';
//       expect(md.render(src)).toEqual(expected);
//     });

//     it('should restrict attributes by allowedAttributes (regex)', () => {
//       md = Md().use(attrs, Object.assign({ allowedAttributes: [/^(class|attr)$/] }, options));
//       const src = 'text {.someclass #someid attr=allowed}';
//       const expected = '<p class="someclass" attr="allowed">text</p>\n';
//       expect(md.render(src)).toEqual(expected);
//     });

// it('should support multiple classes for <hr>', () => {
//   const src = '--- {.a .b}';
//   const expected = '<hr class="a b">\n';
//   expect(md.render(src)).toEqual(expected);
// });

test('should not crash on {#ids} in front of list items', () => {
  const src = '- {#ids} [link](./link)';
  const expected = '<ul>\n<li>{#ids} <a href="./link">link</a></li>\n</ul>\n';
  expect(md.render(src)).toEqual(expected);
});
