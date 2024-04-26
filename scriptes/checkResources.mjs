import assert from 'node:assert';
import { sha256 } from '@quanxiaoxiao/node-utils';
import { Semaphore } from '@quanxiaoxiao/utils';
import {
  fetchEntries,
  fetchEntryStatistics,
  fetchEntryResources,
  fetchResourceChunk,
} from './apis.mjs';

const sem = new Semaphore(24);

const entryList = await fetchEntries();

const entryDefault = entryList.find((d) => d.alias === 'default');

const { count } = await fetchEntryStatistics(entryDefault._id);

const resourceList = await fetchEntryResources(entryDefault._id, count);

for (let i = 0; i < resourceList.length; i++) {
  const resourceItem = resourceList[i];
  sem.acquire(() => {
    fetchResourceChunk(resourceItem._id)
      .then((buf) => {
        assert.equal(sha256(buf), resourceItem.hash);
        console.log(`------${i}`);
        sem.release();
      });
  });
}
