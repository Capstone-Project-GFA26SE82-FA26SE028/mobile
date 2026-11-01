import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const {
  cssToReactNativeRuntime,
} = require('react-native-css-interop/css-to-rn');
const config = require('../tailwind.config.js');
const source = ts.createSourceFile(
  'UI.tsx',
  readFileSync(
    new URL('../src/features/waiter/shared/components/UI.tsx', import.meta.url),
    'utf8',
  ),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);

const css = await postcss([tailwind(config)]).process('@tailwind utilities;', {
  from: undefined,
});
const { rules } = cssToReactNativeRuntime(css.css, { inlineRem: 14 });

function classesFor(component, tag, prop = 'className') {
  const declaration = source.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === component,
  );
  let classes;
  function visit(node) {
    if (classes) return;
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(source) === tag
    ) {
      const attr = node.attributes.properties.find(
        (attr) => ts.isJsxAttribute(attr) && attr.name.text === prop,
      );
      if (attr?.initializer && ts.isStringLiteral(attr.initializer))
        classes = attr.initializer.text;
    }
    ts.forEachChild(node, visit);
  }
  assert.ok(declaration, `Missing component: ${component}`);
  visit(declaration);
  assert.ok(classes, `Missing ${component}/${tag}/${prop}`);
  return classes;
}

function resolve(value) {
  if (!Array.isArray(value)) return value;
  if (value[1] === 'var') return resolve(value[2][1]);
  if (value[1] === 'rgba') return `rgba(${value[2].map(resolve).join(',')})`;
  assert.fail(`Unexpected CSS runtime value: ${JSON.stringify(value)}`);
}

function nativeStyle(classes) {
  const style = {};
  const declarations = classes
    .split(/\s+/)
    .flatMap((name) => {
      assert.ok(rules[name], `Class was not compiled: ${name}`);
      assert.equal(
        rules[name].warnings,
        undefined,
        `Unsupported native class: ${name}`,
      );
      return rules[name].n;
    })
    .sort((a, b) => a.s[0] - b.s[0]);
  for (const rule of declarations) {
    for (const declaration of rule.d) {
      if (declaration.length === 1) Object.assign(style, declaration[0]);
      else style[declaration[1]] = resolve(declaration[0]);
    }
  }
  // Lightning CSS stores lengths as float32.
  return Object.fromEntries(
    Object.entries(style).map(([key, value]) => [
      key,
      typeof value === 'number' ? Math.round(value * 10000) / 10000 : value,
    ]),
  );
}

test('waiter page spacing and maximum width retain the previous pixel values', () => {
  assert.deepEqual(
    nativeStyle(classesFor('Page', 'ScrollView', 'contentContainerClassName')),
    {
      padding: 20,
      paddingBottom: 28,
      rowGap: 18,
      columnGap: 18,
      width: '100%',
      maxWidth: 820,
      alignSelf: 'center',
    },
  );
});

test('waiter cards retain their borders, background, radius and spacing', () => {
  assert.deepEqual(nativeStyle(classesFor('Card', 'View')), {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,1)',
    padding: 17,
    borderWidth: 1,
    borderColor: 'rgba(229,235,231,1)',
    rowGap: 12,
    columnGap: 12,
  });
});

test('waiter heading keeps its original font size, weight, color and letter spacing', () => {
  assert.deepEqual(nativeStyle(classesFor('Title', 'Text')), {
    fontSize: 25,
    fontWeight: '700',
    color: 'rgba(24,59,50,1)',
    letterSpacing: -0.6,
  });
});

test('waiter inputs retain their original dimensions and typography', () => {
  assert.deepEqual(nativeStyle(classesFor('Field', 'TextInput')), {
    borderWidth: 1,
    borderColor: 'rgba(229,235,231,1)',
    backgroundColor: 'rgba(250,252,250,1)',
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 12,
    fontSize: 14,
    color: 'rgba(24,59,50,1)',
    minHeight: 46,
  });
});

test('Tailwind does not introduce a global preflight reset', () => {
  assert.equal(config.corePlugins.preflight, false);
});

test('press feedback retains the previous normal, pressed and disabled opacity', () => {
  assert.deepEqual(nativeStyle('opacity-[1]'), { opacity: 1 });
  assert.deepEqual(nativeStyle('opacity-[0.4]'), { opacity: 0.4 });
  assert.deepEqual(nativeStyle('active:opacity-[0.75]'), { opacity: 0.75 });
  assert.ok(rules['active:opacity-[0.75]'].active);
});
