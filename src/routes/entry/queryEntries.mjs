import { getQuery } from '@quanxiaoxiao/mongo';
import { Entry as EntryModel } from '../../models/index.mjs';

export default async (args) => {
  const query = getQuery(args);
  query.invalid = {
    $ne: true,
  };

  const entryList = await EntryModel
    .find(query)
    .sort({
      order: -1,
      timeCreate: 1,
    })
    .lean();
  return entryList;
};
