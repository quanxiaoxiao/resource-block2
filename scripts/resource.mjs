import assert from 'node:assert';
import { sha256 } from '@quanxiaoxiao/node-utils';
import {
  fetchEntry,
  createEntry,
  removeEntry,
  removeResource,
  fetchResource,
  updateResource,
  fetchResourceChunk,
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
  entry: entryName,
  content: generateChunk(),
});

assert.equal(resourceEmpty, null);

const entryItem = await createEntry({
  name: 'aaXXXXXXXa',
  alias: entryName,
});

const blockChunk = generateChunk();

const resourceItem = await upload({
  entry: entryName,
  content: blockChunk,
});


assert(!!resourceItem);

assert.equal(resourceItem.hash, sha256(blockChunk));
const resourceChunk = await fetchResourceChunk(resourceItem._id);

assert.equal(sha256(blockChunk), sha256(resourceChunk));

let resourceItem2 = await fetchResource(resourceItem._id);

assert.deepEqual(resourceItem, resourceItem2);

resourceItem2 = await removeResource(resourceItem._id);

assert.deepEqual(resourceItem, resourceItem2);

resourceItem2 = await fetchResource(resourceItem._id);

assert.equal(resourceItem2, null);

resourceItem2 = await upload({
  entry: entryName,
  content: generateChunk(),
});

assert(!!resourceItem2);

await removeEntry(entryItem._id);

resourceItem2 = await fetchResource(resourceItem2._id);

assert.equal(resourceItem2, null);

resourceItem2 = await upload({
  entry: entryName,
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
