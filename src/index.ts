import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';

const unquoted = '([^"\'=<>`\\x00-\\x20]+)';
const singleQuoted = "'([^']*)'";
const doubleQuoted = '"([^"]*)"';

const attrName = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
const attrValue = `${unquoted}|${singleQuoted}|${doubleQuoted}`;
const attribute = `(${attrName})=(?:${attrValue})?`;

const REG_ATTR_NAME = new RegExp(`^${attrName}$`);
const REG_ATTRIBUTE = new RegExp(`^${attribute}$`);

const defaultOptions = {
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: [],
};

export type Options = typeof defaultOptions
export enum InfoPos {
  WHOLE = 0,
  LEFT = 1,
  RIGHT = 2,
}
export type Info = {
  pos: InfoPos,
  exp: string,
  text: string,
}

export type Attr = { key: string, value: string[] }

export function findLast (items: Token[], fn: (item: Token) => boolean, startPos: number | undefined = undefined) {
  for (let i = startPos === undefined ? items.length - 1 : startPos; i >= 0; i--) {
    const item = items[i];
    if (fn(item)) {
      return item;
    }
  }
}

export function parseAttr (str: string): Attr | null {
  str = str.trim();

  if (!str) {
    return null;
  }

  // not allow foo=
  if (str.endsWith('=')) {
    return null;
  }

  // class .foo .a.b.c
  if (str.startsWith('.')) {
    const list = str.split('.').filter(Boolean);
    if (!list.length) {
      return null;
    }

    return { key: 'class', value: list };
  }

  // id #foo
  if (str.startsWith('#')) {
    if (str.length < 2) {
      return null;
    }

    return { key: 'id', value: [str.slice(1)] };
  }

  // key-value a=b c="d" e=''
  const match = REG_ATTRIBUTE.exec(str);
  if (match) {
    const key = match[1];
    const value = match[2] || match[3] || match[4];
    return { key, value: value ? [value] : [''] };
  }

  // other foo => foo=""
  if (REG_ATTR_NAME.test(str)) {
    return { key: str, value: [''] };
  }

  return null;
}

export function getAttrs (exp: string) {
  const list: string[] = [];

  let quoted: 0 | 1 | 2 = 0;
  exp.split(' ').forEach(str => {
    if (quoted) {
      list[list.length - 1] += ` ${str}`;
      if (
        (quoted === 1 && str.endsWith('"')) ||
        (quoted === 2 && str.endsWith("'"))) {
        quoted = 0;
      }
    } else {
      list.push(str);
      if (str.includes('="') && !str.endsWith('"')) {
        quoted = 1;
      } else if (str.includes("='") && !str.endsWith("'")) {
        quoted = 2;
      }
    }
  });

  return list.map(parseAttr).filter(Boolean) as Attr[];
}

export function parseToken (token: { content?: string }): Info | null {
  if (!token.content) {
    return null;
  }

  const posStart = token.content.lastIndexOf('{') === 0;
  const posEnd = token.content.indexOf('}') === token.content.length - 1;

  if (posEnd) {
    if (token.content.endsWith('}'.repeat(2))) {
      return null;
    }

    const idx = token.content.lastIndexOf('{');
    if (idx > -1) {
      const exp = token.content.substring(idx + 1, token.content.length - 1);
      const text = token.content.substring(0, idx).trimEnd();
      if (!exp) {
        return null;
      }

      return { pos: posStart ? InfoPos.WHOLE : InfoPos.RIGHT, exp, text };
    }
  } else if (posStart) {
    if (token.content.startsWith('{'.repeat(2))) {
      return null;
    }

    const idx = token.content.indexOf('}');
    if (idx > -1) {
      const exp = token.content.substring(1, idx);
      const text = token.content.substring(idx + 1); // .trimStart();
      if (!exp) {
        return null;
      }

      return { pos: posEnd ? InfoPos.WHOLE : InfoPos.LEFT, exp, text };
    }
  }

  return null;
}

export function applyAttrs (token: Token, attrs: Attr[]) {
  attrs.forEach(attr => {
    const { key, value } = attr;
    if (key === 'class') {
      token.attrJoin('class', value.join(' '));
    } else {
      token.attrPush([key, value.join('')]);
    }
  });
}

export function transformTokens (tokens: Token[], idx: number, childIdx: number, info: Info) {
  const token = tokens[idx];
  const child = token.children![childIdx];
  const children = token.children!;

  let targetToken: Token | undefined;

  const getParentTarget = (level: number | undefined = undefined) => {
    if (idx >= 2) {
      const prev = tokens[idx - 2];
      // apply to list item
      if (prev.type === 'list_item_open' || prev.type.endsWith('list_close')) {
        if (info.pos === InfoPos.WHOLE) {
          return findLast(
            tokens,
            t => t.nesting === 1 &&
              t.type.endsWith('list_open') &&
              (level === undefined || t.level === level),
            idx
          );
        } else {
          return prev; // list item
        }
      }

      if (prev.type === 'blockquote_open') {
        // support blockquote
        return prev; // blockquote
      }
    }

    return tokens[idx - 1]; // parent
  };

  const getPrevTarget = () => {
    const prevToken = findLast(
      children,
      x => (x.nesting === -1) || (x.nesting === 0 && x.type !== 'softbreak'),
      childIdx - 1
    );

    if (!prevToken) {
      return;
    }

    if (prevToken.nesting === 0) {
      return prevToken;
    }

    const prevOpenToken = findLast(
      children,
      x => x.nesting === 1 && x.tag === prevToken!.tag,
      childIdx
    );

    return prevOpenToken;
  };

  const isFirst = childIdx === 0;
  const isLast = childIdx === children.length - 1;

  if (isLast) { // apply to parent
    if (info.pos === InfoPos.WHOLE) {
      if (children.length === 1) {
        targetToken = getParentTarget(0);
      } else {
        const afterSoftbreak = children[childIdx - 1]?.type === 'softbreak';
        if (afterSoftbreak) {
          targetToken = getParentTarget();
        } else {
          targetToken = getPrevTarget();
        }
      }
    } else if (info.pos === InfoPos.LEFT) {
      targetToken = getPrevTarget();
    } else if (info.pos === InfoPos.RIGHT) {
      targetToken = getParentTarget();
    }
  } else if (isFirst) {
    const beforeSoftbreak = children[childIdx + 1]?.type === 'softbreak';
    if (info.pos === InfoPos.RIGHT && beforeSoftbreak) {
      targetToken = getParentTarget();
    }
  } else {
    // ignore like *{.test}*
    if (info.pos === InfoPos.WHOLE && children[childIdx - 1]?.nesting === 1) {
      targetToken = undefined;
    } else {
      targetToken = getPrevTarget();
    }
  }

  if (!targetToken) {
    return;
  }

  const attrs = getAttrs(info.exp);
  if (!attrs.length) {
    return;
  }

  child.content = info.text;

  if (info.pos === InfoPos.WHOLE) {
    token.children?.splice(childIdx, 1);
    if (token.children![childIdx - 1]?.type === 'softbreak') {
      token.children?.splice(childIdx - 1, 1);
    }

    if (!token.children!.length) {
      const prevToken = tokens[idx - 1];
      const nextToken = tokens[idx + 1];
      if (prevToken && nextToken && prevToken.type === 'paragraph_open' && nextToken.type === 'paragraph_close') {
        token.hidden = true;
        prevToken.hidden = true;
        nextToken.hidden = true;
      }
    }
  }

  applyAttrs(targetToken, attrs);
}

export function processToken (tokens: Token[], idx: number) {
  const token = tokens[idx];
  if (token.children && token.children.length) {
    token.children.forEach((child, childIdx, children) => {
      if (child.type !== 'text') {
        return;
      }

      // skip between softbreak tokens
      if (
        childIdx > 0 &&
        childIdx < token.children!.length - 1 &&
        children[childIdx - 1].type === 'softbreak' &&
        children[childIdx + 1].type === 'softbreak'
      ) {
        return;
      }

      const info = parseToken(child);
      if (info) {
        transformTokens(tokens, idx, childIdx, info);
      }
    });
  } else if (token.type === 'fence' && token.info) {
    const info = parseToken({ content: token.info });
    if (info) {
      const attrs = getAttrs(info.exp);
      token.info = info.text;
      applyAttrs(token, attrs);
    }
  }
}

export default function (md: MarkdownIt, options: Options) {
  const opts = { ...defaultOptions, options };
  console.log(opts);
  md.core.ruler.before('linkify', 'curly_attributes', state => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      processToken(tokens, i);
    }
  });
}
