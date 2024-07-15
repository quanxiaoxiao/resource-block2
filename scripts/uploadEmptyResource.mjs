import crypto from 'node:crypto';
import assert from 'node:assert';
import {
  upload,
  fetchResource,
  updateResourceBlock,
} from './apis.mjs';

let resourceItem = await upload({
  name: 'empty',
  content: Buffer.from([]),
});

assert.equal(resourceItem.name, 'empty');
assert.equal(resourceItem.size, 0);
assert.equal(
  resourceItem.hash,
  crypto.createHash('sha256').update(Buffer.from([])).digest('hex'),
);

resourceItem = await fetchResource(resourceItem._id);

assert.equal(resourceItem.size, 0);
assert.equal(resourceItem.name, 'empty');
assert.equal(
  resourceItem.hash,
  crypto.createHash('sha256').update(Buffer.from([])).digest('hex'),
);

resourceItem = await updateResourceBlock(resourceItem._id, Buffer.from('abcd'));

assert.equal(resourceItem.size, 4);
assert.equal(
  resourceItem.hash,
  crypto.createHash('sha256').update(Buffer.from('abcd')).digest('hex'),
);

resourceItem = await updateResourceBlock(resourceItem._id, Buffer.from([]));

assert.equal(resourceItem.size, 0);
assert.equal(
  resourceItem.hash,
  crypto.createHash('sha256').update(Buffer.from([])).digest('hex'),
);

resourceItem = await updateResourceBlock(resourceItem._id, Buffer.from([]));

assert.equal(resourceItem.size, 0);
assert.equal(
  resourceItem.hash,
  crypto.createHash('sha256').update(Buffer.from([])).digest('hex'),
);
