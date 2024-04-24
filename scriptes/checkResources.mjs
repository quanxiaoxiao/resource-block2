import assert from 'node:assert';
import { sha256 } from '@quanxiaoxiao/node-utils';
import { Semaphore } from '@quanxiaoxiao/utils';
import { httpRequest } from '@quanxiaoxiao/http-request';
import {
  fetchEntries,
  fetchEntryStatistics,
  fetchEntryResources,
} from './apis.mjs';

const sem = new Semaphore(24);

const entryList = await fetchEntries();

const entryDefault = entryList.find((d) => d.alias === 'default');

const { count } = await fetchEntryStatistics(entryDefault._id);

const resourceList = await fetchEntryResources(entryDefault._id, count);

const fetchResourceBuf = async (resource) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/resource/${resource}`,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return responseItem.body;
};

for (let i = 0; i < resourceList.length; i++) {
  const resourceItem = resourceList[i];
  sem.acquire(() => {
    fetchResourceBuf(resourceItem._id)
      .then((buf) => {
        assert.equal(sha256(buf), resourceItem.hash);
        console.log(`------${i}`);
        sem.release();
      });
  });
}
