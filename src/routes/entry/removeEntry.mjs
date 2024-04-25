import logger from '../../logger.mjs';
import { Entry as EntryModel } from '../../models/index.mjs';

export default async (entryItem) => {
  logger.warn(`\`${entryItem._id}\` removeEntry`);
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
