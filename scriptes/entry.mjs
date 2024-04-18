import assert from 'node:assert';
import {
  createEntry,
  fetchEntry,
  removeEntry,
  updateEntry,
} from './apis.mjs';

const clear = async () => {
  await [
    'test_123',
    'test_1234',
    'test_9999',
  ].reduce(async (acc, alias) => {
    const entryItem = await fetchEntry(alias);
    if (entryItem) {
      await removeEntry(entryItem._id);
    }
  }, Promise.resolve);
};

await clear();

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

let entryItem3 = await createEntry({
  name: 'eee',
  alias: 'test_123',
});

assert(entryItem3 === null);

entryItem3 = await createEntry({
  name: 'eee',
  alias: 'test_1234',
});

assert.equal(entryItem3.name, 'eee');
assert.equal(entryItem3.alias, 'test_1234');

const bbb = await updateEntry(entryItem3._id, {
  alias: 'test_123',
});

assert.equal(bbb, null);

entryItem3 = await fetchEntry('test_1234');

assert.equal(entryItem3.name, 'eee');

entryItem2 = await fetchEntry('test_123');

assert.equal(entryItem2.name, 'fffffff');

entryItem2 = await updateEntry('test_123', {
  alias: 'test_9999',
});

assert.equal(entryItem2.alias, 'test_9999');

entryItem2 = await removeEntry('test_123');

assert.equal(entryItem2, null);

entryItem3 = await updateEntry('test_1234', {
  alias: 'test_123',
});

assert.equal(entryItem3.name, 'eee');

entryItem3 = await fetchEntry('test_1234');

assert.equal(entryItem3, null);

entryItem3 = await fetchEntry('test_123');

assert.equal(entryItem3.name, 'eee');

entryItem2 = await removeEntry(entryItem._id);

assert.equal(entryItem2.alias, 'test_9999');
assert.equal(entryItem2.name, 'fffffff');

entryItem3 = await updateEntry(entryItem3._id, {
  alias: 'test_9999',
});

assert.equal(entryItem3.alias, 'test_9999');
assert.equal(entryItem3.name, 'eee');

await clear();
