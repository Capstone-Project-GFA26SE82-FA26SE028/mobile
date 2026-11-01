import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { outputText } = ts.transpileModule(
  readFileSync(
    new URL(
      '../src/features/waiter/tables/components/TableGrid.tsx',
      import.meta.url,
    ),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
);
const sandbox = {
  exports: {},
  require: (name) =>
    name === 'react-native' ? { View: 'View' } : require(name),
};
runInNewContext(outputText, sandbox);
const { TableGrid } = sandbox.exports;

test('adding tables preserves two equal columns and reserves the final empty cell', () => {
  for (const count of [0, 1, 2, 3, 5, 20]) {
    const items = Array.from({ length: count }, (_, index) => ({
      id: `T${index + 1}`,
    }));
    const grid = TableGrid({
      items,
      getKey: (item) => item.id,
      renderItem: (item) => item.id,
    });
    const rows = Array.from(grid.props.children);
    assert.equal(rows.length, Math.ceil(count / 2));
    const rendered = [];
    for (const row of rows) {
      assert.ok(row.props.className.includes('flex-row'));
      assert.ok(!row.props.className.includes('flex-wrap'));
      const [cells, empty] = row.props.children;
      assert.equal(cells.length + (empty ? 1 : 0), 2);
      for (const cell of [...cells, ...(empty ? [empty] : [])]) {
        assert.equal(cell.props.style.flex, 1);
        assert.equal(cell.props.style.minWidth, 0);
        if (cell.props.children) rendered.push(cell.props.children);
      }
    }
    assert.deepEqual(
      rendered,
      items.map((item) => item.id),
    );
  }
});
