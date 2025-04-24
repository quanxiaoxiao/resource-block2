import assert from 'node:assert';

import {
  createEntry,
  fetchEntry,
  fetchResource,
  removeEntry,
  removeResource,
  updateEntry,
  upload,
} from './apis.mjs';
import generateChunk from './generateChunk.mjs';

const entryAlias = 'quan_xxxxxx_aaa';

{
  const entryItem = await fetchEntry(entryAlias);
  if (entryItem) {
    await removeEntry(entryItem._id);
  }
}

let entryItem = await createEntry({
  name: 'aaa_bbccdd_dee',
  alias: entryAlias,
});

assert.equal(entryItem.readOnly, false);

let resourceItem = await upload({
  entry: entryItem._id,
  content: generateChunk(),
});

assert(!!resourceItem);

entryItem = await updateEntry(entryItem._id, {
  readOnly: true,
});

assert(entryItem.readOnly);

resourceItem = await fetchResource(resourceItem._id);

assert(!!resourceItem);

resourceItem = await removeResource(resourceItem._id);

assert.equal(resourceItem, null);

resourceItem = await upload({
  entry: entryItem._id,
  content: generateChunk(),
});

assert.equal(resourceItem, null);

entryItem = await updateEntry(entryItem._id, {
  readOnly: false,
});

assert(!entryItem.readOnly);

resourceItem = await upload({
  entry: entryItem._id,
  content: generateChunk(),
});

assert(!!resourceItem);

await removeEntry(entryAlias);
