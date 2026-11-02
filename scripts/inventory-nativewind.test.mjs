import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const {
  cssToReactNativeRuntime,
} = require('react-native-css-interop/css-to-rn');
const root = new URL('../src/features/inventory/', import.meta.url);
const sources = readdirSync(root, { recursive: true })
  .filter((name) => name.endsWith('.tsx'))
  .map((name) =>
    ts.createSourceFile(
      name,
      readFileSync(new URL(name.replaceAll('\\', '/'), root), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
  );
const css = await postcss([tailwind(require('../tailwind.config.js'))]).process(
  '@tailwind utilities;',
  { from: undefined },
);
const { rules } = cssToReactNativeRuntime(css.css, { inlineRem: 14 });

function attributes(source, name) {
  const found = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === name)
      found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}

// Read class values without treating strings inside conditions as CSS classes.
function classValues(node) {
  if (ts.isJsxExpression(node)) return classValues(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return [node.text];
  if (ts.isConditionalExpression(node))
    return [...classValues(node.whenTrue), ...classValues(node.whenFalse)];
  if (ts.isTemplateExpression(node))
    return [
      node.head.text,
      ...node.templateSpans.flatMap((span) => [
        ...classValues(span.expression),
        span.literal.text,
      ]),
    ];
  throw new Error(`Unexpected class expression: ${node.getText()}`);
}

test('all inventory classes compile for native, including selected and pressed states', () => {
  const classes = new Set(
    sources
      .flatMap((source) =>
        ['className', 'contentContainerClassName'].flatMap((name) =>
          attributes(source, name).flatMap((attr) =>
            classValues(attr.initializer),
          ),
        ),
      )
      .flatMap((value) => value.trim().split(/\s+/).filter(Boolean)),
  );
  for (const name of classes) {
    assert.ok(rules[name], `Class not generated: ${name}`);
    assert.equal(
      rules[name].warnings,
      undefined,
      `Unsupported native class: ${name}`,
    );
  }
  assert.ok(rules['active:bg-[#FAFCFA]'].active);
});

test('phone list passes no column wrapper style; tablet retains its two-column gap', () => {
  const source = sources.find((source) =>
    source.fileName.endsWith('StockListScreen.tsx'),
  );
  // NativeWind remaps even an empty wrapper class into a style object, which
  // FlatList rejects when numColumns is 1. Keep this conditional native prop.
  assert.equal(attributes(source, 'columnWrapperClassName').length, 0);
  const evaluate = (name, wide) =>
    Function(
      'wide',
      `return (${attributes(source, name)[0].initializer.expression.getText(source)})`,
    )(wide);
  assert.equal(evaluate('numColumns', false), 1);
  assert.equal(evaluate('columnWrapperStyle', false), undefined);
  assert.equal(evaluate('numColumns', true), 2);
  assert.deepEqual(evaluate('columnWrapperStyle', true), { gap: 12 });
});

test('stock list retains pixel spacing and maximum width', () => {
  const source = sources.find((source) =>
    source.fileName.endsWith('StockListScreen.tsx'),
  );
  const classes = classValues(
    attributes(source, 'contentContainerClassName')[0].initializer,
  )[0];
  const style = {};
  for (const name of classes.split(/\s+/))
    for (const rule of rules[name].n)
      for (const declaration of rule.d) {
        if (declaration.length === 1) Object.assign(style, declaration[0]);
        else style[declaration[1]] = declaration[0];
      }
  assert.deepEqual(style, {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 28,
  });
});
