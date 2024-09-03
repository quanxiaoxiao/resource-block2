import assert from 'node:assert';
import { sort } from '@quanxiaoxiao/list';
import { Entry as EntryModel } from '../../models/index.mjs';
import store from '../../store/store.mjs';
import findEntryOfAlias from './findEntryOfAlias.mjs';
import createEntry from './createEntry.mjs';

const { dispatch } = store;

export default async () => {
  const entryList = await EntryModel.find({
    invalid: {
      $ne: true,
    },
  });
  const aliasList = entryList
    .filter((d) => d.alias && d.alias.trim())
    .map((d) => d.alias.trim());
  assert(aliasList.length === Array.from(new Set(aliasList)).length);
  dispatch('entryList', sort(entryList.map((d) => ({
    _id: d._id.toString(),
    alias: (d.alias ?? '').trim(),
    name: d.name,
    order: d.order,
    dateTimeCreate: d.dateTimeCreate,
    description: d.description,
    readOnly: d.readOnly,
  }))));
  if (!findEntryOfAlias('default')) {
    createEntry({
      name: 'default',
      alias: 'default',
    });
  }
};