import createError from 'http-errors';

import createEntry from '#controllers/entry/createEntry.mjs';
import findEntryOfAlias from '#controllers/entry/findEntryOfAlias.mjs';

export default async (input) => {
  const data = {
    ...input,
  };
  if (typeof data.alias === 'string' && data.alias.trim() !== '') {
    data.alias = data.alias.trim();
    if (findEntryOfAlias(data.alias)) {
      throw createError(403, `\`${data.alias}\` alias alreay set`);
    }
  }
  const entryItem = await createEntry(input);
  return entryItem;
};
