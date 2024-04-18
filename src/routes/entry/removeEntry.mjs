import { Entry as EntryModel } from '../../models/index.mjs';

export default async (entryItem) => {
  await EntryModel.updateOne(
    {
      _id: entryItem._id,
      invalid: {
        $ne: true,
      },
    },
    {
      $set: {
        invalid: true,
        timeInvalid: Date.now(),
      },
    },
  );
};
