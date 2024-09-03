import { generateSortDataUpdates } from '@quanxiaoxiao/mongo';
import { Entry as EntryModel } from '../../models/index.mjs';
import getEntryList from '../../controllers/entry/getEntryList.mjs';

export default async (input) => {
  const entryList = getEntryList();

  const updates = generateSortDataUpdates(entryList, input);

  await EntryModel.updateMany(
    {
    },
    {
      $set: {
        order: null,
      },
    },
  );
  await EntryModel.bulkWrite(updates);
  return getEntryList();
};
