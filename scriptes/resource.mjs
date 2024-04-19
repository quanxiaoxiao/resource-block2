import assert from 'node:assert';
import { httpRequest } from '@quanxiaoxiao/http-request';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';
import {
  fetchEntry,
  createEntry,
  removeEntry,
  removeResource,
  fetchResource,
} from './apis.mjs';

const upload = async (entryName) => {
  const content = Buffer.from(`${Date.now()}__aaabbccdee`);

  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'POST',
    path: `/upload/${entryName}`,
    body: content,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

const entryName = 'test_88';

{
  const entryItem = await fetchEntry(entryName);
  if (entryItem) {
    await removeEntry(entryItem._id);
  }
}

const resourceEmpty = await upload(entryName);

assert.equal(resourceEmpty, null);

await createEntry({
  name: 'aaXXXXXXXa',
  alias: entryName,
});

const resourceItem = await upload(entryName);

let resourceItem2 = await fetchResource(resourceItem._id);

assert.deepEqual(resourceItem, resourceItem2);

resourceItem2 = await removeResource(resourceItem._id);

assert.deepEqual(resourceItem, resourceItem2);

resourceItem2 = await fetchResource(resourceItem._id);

assert.equal(resourceItem2, null);
