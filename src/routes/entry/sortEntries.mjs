import { generateSortDataUpdates } from '@quanxiaoxiao/mongo';
import { Entry as EntryModel } from '../../models/index.mjs';

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
  return EntryModel.find({
    invalid: {
      $ne: true,
    },
  }).sort({
    order: -1,
    timeCreate: 1,
  });
};
