import type {PrismTheme} from 'prism-react-renderer';

// Code block colours in the Openbeehive palette. Every colour has a contrast
// of at least 4.5:1 against the background of its theme (WCAG AA), which the
// stock "github" and "dracula" themes do not reach for comments and several
// token types.

type Palette = {
  background: string;
  plain: string;
  comment: string;
  string: string;
  number: string;
  keyword: string;
  function: string;
  attribute: string;
  deleted: string;
  inserted: string;
};

function theme(p: Palette): PrismTheme {
  return {
    plain: {color: p.plain, backgroundColor: p.background},
    styles: [
      {
        types: ['comment', 'prolog', 'doctype', 'cdata'],
        style: {color: p.comment, fontStyle: 'italic'},
      },
      {types: ['punctuation', 'operator'], style: {color: p.plain}},
      {
        types: ['string', 'char', 'attr-value', 'regex'],
        style: {color: p.string},
      },
      {
        types: [
          'number',
          'boolean',
          'constant',
          'symbol',
          'variable',
          'property',
          'entity',
          'url',
        ],
        style: {color: p.number},
      },
      {
        types: ['keyword', 'atrule', 'selector', 'important'],
        style: {color: p.keyword},
      },
      {
        types: ['function', 'tag', 'builtin', 'class-name'],
        style: {color: p.function},
      },
      {types: ['attr-name', 'function-variable'], style: {color: p.attribute}},
      {types: ['deleted'], style: {color: p.deleted}},
      {types: ['inserted'], style: {color: p.inserted}},
    ],
  };
}

export const lightCodeTheme = theme({
  background: '#f5eedd',
  plain: '#2c2316',
  comment: '#6b5e48',
  string: '#4a5c33',
  number: '#0b6464',
  keyword: '#9a2f1e',
  function: '#8a5210',
  attribute: '#5a3fa0',
  deleted: '#b3261e',
  inserted: '#3f6b2a',
});

export const darkCodeTheme = theme({
  background: '#261f14',
  plain: '#f5ecda',
  comment: '#b0a28a',
  string: '#b8d08f',
  number: '#7fd1c7',
  keyword: '#f2a38a',
  function: '#edb45e',
  attribute: '#c9b3f5',
  deleted: '#f28b82',
  inserted: '#a9d18a',
});
