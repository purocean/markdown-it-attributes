/* eslint-disable @typescript-eslint/no-var-requires */
const Markdown = require('markdown-it');
const MarkdownItAttrs = require('markdown-it-attrs');
const MarkdownItAttributes = require('./lib/bundle.cjs').default;

const md = Markdown({});
const mdMarkdownItAttrs = Markdown({}).use(MarkdownItAttrs);
const mdMarkdownItAttributes = Markdown({}).use(MarkdownItAttributes);

// const src = '- abc\n- 123\n\nabc\n{.red}';
// console.log(mdMarkdownItAttrs.render(src));
// process.exit();

const test1 = `
some text {with=attrs}

a
{.bgw}
c

some text {.abc.d..e class=attrs}

some text {{with=attrs}}

some text
{with=attrs}

some text
{with=attrs}

some text {.green}

some text {#section2}

some text {attr="lorem ipsum"}

some text {.c1 .c2}

 1 | 2
 --|--
 a |

paragraph **bold**{.red} asdf

paragraph **bold**{{.red}} asdf

{{.red}

- item 1{.red}
- item 2

- item 1{.a}
  - nested item {.b}
  {.c}
    1. nested nested item {.d}
    {.e}


- **bold *italics*{.blue}**{.green}

bla \`click()\`{.c}

- **bold** text {.red}

text { .red }

- item1
- item2
{.red}

- item{.red}
{.blue}

- item
{.blue}

- item
*{.blue}*

1. item
{.blue}

text {key="val with spaces"}

\`\`\`{.c a=1 #ii}
for i in range(10):
\`\`\`

\`\`\`python {.c a=1 #ii}
for i in range(10):
\`\`\`

> quote
{.c}

| h1 | h2 |
| -- | -- |
| c1 | c1 |

{.c}

- item
  - nested
  {.red}

{.blue}


![alt](img.png){.a}

![alt](img.png){.a}

$\\sqrt{a}$

paragraph \`code{.red}\`

- item with trailing \`code = {.red}\`

- item with trailing *{.red}*

bla \`click()\`{.c} blah \`release()\`{.cpp}

text {a}

text {.}

text {#}

text {.someclass #someid attr=notAllowed}

text {.someclass #someid attr=allowed}

some text{link=/some/page/in/app/id=1}

| h1 | h2 |
| -- | -- |
| c1 | c1 |

test {.c}

| h1 | h2 |
| -- | -- |
| c1 | c1 |

test
{.c}

- abc
- 123

ac
{.red}

- abc
- 123

ac{.red}

`.repeat(2000);

let time1, time2;

time1 = process.hrtime.bigint();
md.render(test1);
time2 = process.hrtime.bigint();
console.log(`no plugin: ${(time2 - time1) / 1000000n}ms`);

time1 = process.hrtime.bigint();
const res1 = mdMarkdownItAttrs.render(test1);
time2 = process.hrtime.bigint();
console.log(`markdown-it-attrs test1: ${(time2 - time1) / 1000000n}ms`);

time1 = process.hrtime.bigint();
const res2 = mdMarkdownItAttributes.render(test1);
time2 = process.hrtime.bigint();
console.log(`markdown-it-attributes test1: ${(time2 - time1) / 1000000n}ms`);

console.log('result equal:', res1.replace(/\n/g, '') === res2.replace(/\n/g, ''));
