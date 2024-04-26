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

await entryList.reduce(async (acc, entryItem) => {
  await acc;
  const { count } = await fetchEntryStatistics(entryItem._id);
  const resourceList = await fetchEntryResources(entryItem._id, count);

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
}, Promise.resolve);
