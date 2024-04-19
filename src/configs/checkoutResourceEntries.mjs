import assert from 'node:assert';
import curd from '@quanxiaoxiao/curd';
import store from '../store/store.mjs';
import queryEntries from '../routes/entry/queryEntries.mjs';
import createEntry from '../routes/entry/createEntry.mjs';

const { dispatch } = store;

export default async () => {
  const entryList = await queryEntries({});
  if (!curd.find(entryList, { alias: 'default' })) {
    const entryItem = await createEntry({
      name: 'default',
      alias: 'default',
    });
    assert(!!entryItem);
    entryList.push(entryItem);
  }
  dispatch('entryList', entryList);
};
