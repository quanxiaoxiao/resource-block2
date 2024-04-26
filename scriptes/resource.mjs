import assert from 'node:assert';
import {
  fetchEntry,
  createEntry,
  removeEntry,
  removeResource,
  fetchResource,
  updateResource,
  upload,
} from './apis.mjs';
import generateChunk from './generateChunk.mjs';

const entryName = 'test_88';

{
  const entryItem = await fetchEntry(entryName);
  if (entryItem) {
    await removeEntry(entryItem._id);
  }
}

const resourceEmpty = await upload({
  entryName,
  content: generateChunk(),
});

assert.equal(resourceEmpty, null);

const entryItem = await createEntry({
  name: 'aaXXXXXXXa',
  alias: entryName,
});

const resourceItem = await upload({
  entryName,
  content: generateChunk(),
});

let resourceItem2 = await fetchResource(resourceItem._id);

assert.deepEqual(resourceItem, resourceItem2);

resourceItem2 = await removeResource(resourceItem._id);

assert.deepEqual(resourceItem, resourceItem2);

resourceItem2 = await fetchResource(resourceItem._id);

assert.equal(resourceItem2, null);

resourceItem2 = await upload({
  entryName,
  content: generateChunk(),
});

assert(!!resourceItem2);

await removeEntry(entryItem._id);

resourceItem2 = await fetchResource(resourceItem2._id);

assert.equal(resourceItem2, null);

resourceItem2 = await upload({
  entryName,
  content: generateChunk(),
});

assert.equal(resourceItem2, null);

resourceItem2 = await upload({
  content: generateChunk(),
});

assert.equal(resourceItem2.name, '');

resourceItem2 = await updateResource(resourceItem2._id, {
  name: 'cqqq',
});

assert.equal(resourceItem2.name, 'cqqq');

resourceItem2 = await updateResource(resourceItem2._id, {
  name: '',
});

assert.equal(resourceItem2, null);
