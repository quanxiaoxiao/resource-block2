import assert from 'node:assert';
import { httpRequest } from '@quanxiaoxiao/http-request';
import {
  fetchEntry,
  createEntry,
  removeEntry,
} from './apis.mjs';

const entryName = 'test_88';

{
  const entryItem = await fetchEntry(entryName);
  if (entryItem) {
    await removeEntry(entryItem._id);
  }
}

const content = Buffer.from(`${Date.now()}__aaabbccdee`);

let responseItem = await httpRequest({
  hostname: '127.0.0.1',
  port: 4059,
  method: 'POST',
  path: `/upload/${entryName}`,
  body: content,
});

assert.equal(responseItem.statusCode, 403);

await createEntry({
  name: 'aaXXXXXXXa',
  alias: entryName,
});

responseItem = await httpRequest({
  hostname: '127.0.0.1',
  port: 4059,
  method: 'POST',
  path: `/upload/${entryName}?name=aaabb`,
  body: content,
});

console.log(responseItem.body.toString());
