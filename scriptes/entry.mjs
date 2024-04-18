import assert from 'node:assert';
import {
  createEntry,
  fetchEntry,
  removeEntry,
  updateEntry,
} from './apis.mjs';

const entryItem = await createEntry({
  name: 'aaa',
});

assert(entryItem);

let entryItem2 = await fetchEntry(entryItem._id);

assert.deepEqual(entryItem, entryItem2);

entryItem2 = await updateEntry(entryItem2._id, {
  alias: 'test_123',
});

assert.equal(entryItem2.alias, 'test_123');

entryItem2 = await fetchEntry('test_123');

assert.equal(entryItem2._id, entryItem._id);
assert.equal(entryItem2.alias, 'test_123');

entryItem2 = await updateEntry(entryItem2._id, {
  name: 'fffffff',
  alias: 'test_123',
});

assert.equal(entryItem2.name, 'fffffff');
assert.equal(entryItem2.alias, 'test_123');

entryItem2 = await fetchEntry('test_123');

assert.equal(entryItem2.name, 'fffffff');
assert.equal(entryItem2.alias, 'test_123');

entryItem2 = await removeEntry(entryItem._id);

assert(entryItem2 != null);

entryItem2 = await fetchEntry(entryItem._id);

assert.equal(entryItem2, null);

entryItem2 = await fetchEntry('test_123');

assert.equal(entryItem2, null);

console.log(999);
