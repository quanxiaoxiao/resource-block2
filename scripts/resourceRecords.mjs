import assert from 'node:assert';
import { waitFor } from '@quanxiaoxiao/utils';
import { sha256 } from '@quanxiaoxiao/node-utils';
import _ from 'lodash';
import {
  removeResource,
  updateResourceBlock,
  upload,
  fetchResourceRecords,
  fetchResourceChunk,
} from './apis.mjs';
import generateChunk from './generateChunk.mjs';

let blockChunk = generateChunk(_.random(20, 50));

const resourceItem = await upload({
  content: blockChunk,
  name: 'abcd',
});

assert.equal(resourceItem.hash, sha256(blockChunk));

let resourceRecordList = await fetchResourceRecords(resourceItem._id);

assert.equal(resourceRecordList.length, 1);
assert.equal(resourceRecordList[0].countRead, 0);
assert.equal(resourceRecordList[0].dateTimeAccess, null);
assert.equal(resourceRecordList[0].hash, resourceItem.hash);
assert.equal(resourceRecordList[0].size, blockChunk.length);

let chunkRet = await fetchResourceChunk(resourceItem._id);

assert(sha256(chunkRet), sha256(blockChunk));

resourceRecordList = await fetchResourceRecords(resourceItem._id);
assert.equal(resourceRecordList.length, 1);
assert.equal(resourceRecordList[0].countRead, 1);
assert(resourceRecordList[0].dateTimeAccess < Date.now());
assert(resourceRecordList[0].dateTimeAccess > Date.now() - 500);
assert.equal(resourceRecordList[0].hash, resourceItem.hash);
await waitFor(1000);

chunkRet = await fetchResourceChunk(resourceItem._id);
assert(sha256(chunkRet), sha256(blockChunk));

resourceRecordList = await fetchResourceRecords(resourceItem._id);
assert.equal(resourceRecordList.length, 1);
assert.equal(resourceRecordList[0].countRead, 2);
assert(resourceRecordList[0].dateTimeAccess < Date.now());
assert(resourceRecordList[0].dateTimeAccess > Date.now() - 500);
assert.equal(resourceRecordList[0].hash, resourceItem.hash);



blockChunk = generateChunk(_.random(50, 80));

let resourceItem2 = await updateResourceBlock(resourceItem._id, blockChunk);


assert.equal(resourceItem2._id, resourceItem._id);

assert.equal(resourceItem2.hash, sha256(blockChunk));

resourceRecordList = await fetchResourceRecords(resourceItem._id);

assert.equal(resourceRecordList.length, 2);
assert.equal(resourceRecordList[0].countRead, 0);
assert.equal(resourceRecordList[0].dateTimeAccess, null);
assert.equal(resourceRecordList[0].hash, resourceItem2.hash);

chunkRet = await fetchResourceChunk(resourceItem._id);
assert(sha256(chunkRet), sha256(blockChunk));

resourceRecordList = await fetchResourceRecords(resourceItem._id);
assert.equal(resourceRecordList.length, 2);
assert.equal(resourceRecordList[0].countRead, 1);
assert(resourceRecordList[0].dateTimeAccess < Date.now());
assert(resourceRecordList[0].dateTimeAccess > Date.now() - 500);
assert.equal(resourceRecordList[0].hash, resourceItem2.hash);

resourceItem2 = await removeResource(resourceItem2._id);

assert.equal(resourceItem2.hash, sha256(blockChunk));

resourceRecordList = await fetchResourceRecords(resourceItem2._id);

assert.equal(resourceRecordList, null);
