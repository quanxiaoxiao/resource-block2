import assert from 'node:assert';
import _ from 'lodash';
import { Semaphore } from '@quanxiaoxiao/utils';
import { sha256 } from '@quanxiaoxiao/node-utils';
import generateChunk from './generateChunk.mjs';
import {
  removeResource,
  fetchResource,
  fetchResourceChunk,
  upload,
  updateResourceBlock,
} from './apis.mjs';

const semp = new Semaphore(24);

const aaa = async () => {
  const buf2 = generateChunk(_.random(30, 800));
  const buf1 = generateChunk(_.random(30, 800));
  assert(sha256(buf1) !== sha256(buf2));
  let data = await upload({
    content: buf1,
  });
  assert(data !== null);
  assert.equal(data.hash, sha256(buf1));
  let resourceChunk = await fetchResourceChunk(data._id);
  assert.equal(sha256(resourceChunk), sha256(buf1));
  data = await upload({
    content: buf2,
  });
  assert(data !== null);
  assert.equal(data.hash, sha256(buf2));
  resourceChunk = await fetchResourceChunk(data._id);
  assert.equal(sha256(resourceChunk), sha256(buf2));

  data = await fetchResource(data._id);

  data = await updateResourceBlock(data._id, buf1);
  assert.equal(data.hash, sha256(buf1));
  resourceChunk = await fetchResourceChunk(data._id);
  assert.equal(sha256(resourceChunk), sha256(buf1));
  let resourceItem = await removeResource(data._id);
  assert.equal(resourceItem._id, data._id);
  resourceItem = await fetchResource(resourceItem._id);
  assert.equal(resourceItem, null);
};

for (let i = 0; i < 8000; i++) {
  semp.acquire(() => {
    aaa().then(
      () => {
        semp.release();
      },
    );
  });
}
