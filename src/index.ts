import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';

const unquoted = '([^"\'<>`\\x00-\\x20]+)';
const singleQuoted = "'([^']*)'";
const doubleQuoted = '"([^"]*)"';

const attrName = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
const attrValue = `${unquoted}|${singleQuoted}|${doubleQuoted}`;
const attribute = `(${attrName})=(?:${attrValue})?`;

const REG_ATTR_NAME = new RegExp(`^${attrName}$`);
const REG_ATTRIBUTE = new RegExp(`^${attribute}$`);
const REG_SPLIT_ATTRS = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;

export const defaultOptions = {
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: undefined as (string | RegExp)[] | undefined,
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

export function escapeRE (exp: string) {
  return exp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

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

  // class .foo => class=foo .a.b.c => class=a.b.c
  if (str.startsWith('.')) {
    if (str.length < 2) {
      return null;
    }

    return { key: 'class', value: [str.slice(1)] };
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
  const list = exp.match(REG_SPLIT_ATTRS) || [];
  return list.map(parseAttr).filter(Boolean) as Attr[];
}

export function replaceExp (exp: string, opts: Options) {
  const reg = `\\\\(${escapeRE(opts.leftDelimiter)}|${escapeRE(opts.rightDelimiter)})`;
  return exp.replace(new RegExp(reg, 'g'), '$1');
}

export function getIndices (opts: Options, content: string): [number, number, boolean] | null {
  const len = content.length;
  const delimiterLength = opts.leftDelimiter.length;
  let startIdx = -1;
  let endIdx = -1;
  let str = '';
  let hasEscape = false;

  for (let i = 0; i < len; i++) {
    if (content.charCodeAt(i) === 0x5c) { // \
      i++;
      hasEscape = true;
      continue;
    }

    str = content.slice(i, i + delimiterLength);
    if (str === opts.leftDelimiter) {
      startIdx = i;
    }

    if (endIdx === -1 && str === opts.rightDelimiter) {
      endIdx = i;
    }
  }

  if (startIdx >= endIdx) {
    return null;
  }

  return [startIdx, endIdx, hasEscape];
}

export function parseInfo (opts: Options, content?: string | null): Info | null {
  if (!content) {
    return null;
  }

  // fail fast
  if (!content.startsWith(opts.leftDelimiter) && !content.endsWith(opts.rightDelimiter)) {
    return null;
  }

  const indices = getIndices(opts, content);

  if (!indices) {
    return null;
  }

  const [startIdx, endIdx, hasEscape] = indices;

  const posStart = startIdx === 0;
  const posEnd = endIdx === content.length - opts.rightDelimiter.length;

  let exp: string;
  let text: string;
  let pos: InfoPos;

  if (posEnd && startIdx > -1) {
    exp = content.substring(startIdx + opts.leftDelimiter.length, content.length - opts.leftDelimiter.length);
    text = content.substring(0, startIdx).trimEnd();
    if (!exp) {
      return null;
    }

    pos = posStart ? InfoPos.WHOLE : InfoPos.RIGHT;
  } else if (posStart && endIdx > -1) {
    exp = content.substring(opts.leftDelimiter.length, endIdx);
    text = content.substring(endIdx + opts.rightDelimiter.length); // .trimStart();
    if (!exp) {
      return null;
    }

    pos = posEnd ? InfoPos.WHOLE : InfoPos.LEFT;
  } else {
    return null;
  }

  return {
    pos,
    exp: hasEscape ? replaceExp(exp, opts) : exp,
    text
  };
}

export function applyAttrs (opts: Options, token: Token, attrs: Attr[]) {
  attrs.forEach(attr => {
    const { key, value } = attr;

    if (
      opts.allowedAttributes &&
      opts.allowedAttributes.length > 0 &&
      !opts.allowedAttributes.some(x => x === key || (x instanceof RegExp && x.test(key)))
    ) {
      return;
    }

    if (key === 'class') {
      token.attrJoin('class', value.join(' '));
    } else {
      token.attrPush([key, value.join('')]);
    }
  });
}

export function transformTokens (opts: Options, tokens: Token[], idx: number, childIdx: number, info: Info) {
  const token = tokens[idx];
  const child = token.children![childIdx];
  const children = token.children!;

  let targetToken: Token | undefined;

  const getParentTarget = (level: number | undefined = undefined) => {
    if (idx >= 2) {
      const prev = tokens[idx - 2];

      // apply to table
      if (info.pos === InfoPos.WHOLE && children.length === 1 && prev.type === 'table_close') {
        if (info.pos === InfoPos.WHOLE) {
          return findLast(
            tokens,
            t => t.nesting === 1 &&
              (level === undefined || t.level === level) &&
              t.type.endsWith('table_open'),
            idx
          );
        } else {
          return undefined; // do nothing
        }
      }

      // apply to list
      if (
        info.pos === InfoPos.WHOLE &&
        (
          prev.type === 'list_item_open' ||
          (children.length === 1 && prev.type.endsWith('list_close'))
        )
      ) {
        return findLast(
          tokens,
          t => t.nesting === 1 &&
            (level === undefined || t.level === level) &&
            t.type.endsWith('list_open'),
          idx
        );
      }

      // apply to list item
      if (prev.type === 'list_item_open') {
        return prev;
      }

      // apply to blockquote
      if (prev.type === 'blockquote_open') {
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

  applyAttrs(opts, targetToken, attrs);
}

export function processToken (opts: Options, tokens: Token[], idx: number) {
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

      const info = parseInfo(opts, child.content);
      if (info) {
        transformTokens(opts, tokens, idx, childIdx, info);
      }
    });
  } else if (token.type === 'fence' && token.info) {
    const info = parseInfo(opts, token.info);
    if (info) {
      const attrs = getAttrs(info.exp);
      token.info = info.text;
      applyAttrs(opts, token, attrs);
    }
  }
}

export default function MarkdownItAttributes (md: MarkdownIt, options?: Partial<Options>) {
  const opts = { ...defaultOptions, ...options };

  if (opts.leftDelimiter.length !== opts.rightDelimiter.length) {
    throw new Error('leftDelimiter and rightDelimiter must be the same length');
  }

  md.core.ruler.before('linkify', 'curly_attributes', state => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      processToken(opts, tokens, i);
    }
  });
}
