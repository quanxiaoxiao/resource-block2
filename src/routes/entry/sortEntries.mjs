import { generateSortDataUpdates } from '@quanxiaoxiao/mongo';
import { Entry as EntryModel } from '../../models/index.mjs';
import queryEntries from './queryEntries.mjs';

export default async (input) => {
  const entryList = await EntryModel.find({
    invalid: {
      $ne: true,
    },
  });

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
  return queryEntries({});
};
