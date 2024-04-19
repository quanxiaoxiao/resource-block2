import store from '../store/store.mjs';
import queryEntries from '../routes/entry/queryEntries.mjs';

const { dispatch } = store;

export default async () => {
  const entryList = await queryEntries({});
  dispatch('entryList', entryList);
};
