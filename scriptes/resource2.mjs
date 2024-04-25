import assert from 'node:assert';
import crypto from 'node:crypto';
import _ from 'lodash';
import { Semaphore } from '@quanxiaoxiao/utils';
import { sha256 } from '@quanxiaoxiao/node-utils';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';
import { httpRequest } from '@quanxiaoxiao/http-request';
import {
  removeResource,
  fetchResource,
} from './apis.mjs';

const semp = new Semaphore(24);

const fetchResourceChunk = async (resource) => {
  const resourceItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/resource/${resource}`,
  });
  assert.equal(resourceItem.statusCode, 200);
  return resourceItem.body;
};

const aaa = async () => {
  const buf2 = crypto.randomBytes(_.random(30, 80));
  const buf1 = crypto.randomBytes(_.random(30, 80));
  assert(sha256(buf1) !== sha256(buf2));
  let responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'POST',
    path: '/upload',
    body: buf1,
  });
  assert.equal(responseItem.statusCode, 200);
  let data = decodeContentToJSON(responseItem.body, responseItem.headers);
  assert.equal(data.hash, sha256(buf1));
  let resourceChunk = await fetchResourceChunk(data._id);
  assert.equal(sha256(resourceChunk), sha256(buf1));
  responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'PUT',
    path: `/resource/${data._id}`,
    body: buf2,
  });
  assert.equal(responseItem.statusCode, 200);
  data = decodeContentToJSON(responseItem.body, responseItem.headers);
  assert.equal(data.hash, sha256(buf2));
  resourceChunk = await fetchResourceChunk(data._id);
  assert.equal(sha256(resourceChunk), sha256(buf2));

  responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'PUT',
    path: `/resource/${data._id}`,
    body: buf1,
  });
  assert.equal(responseItem.statusCode, 200);
  data = decodeContentToJSON(responseItem.body, responseItem.headers);
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
