import createError from 'http-errors';

import findEntryOfAlias from '#controllers/entry/findEntryOfAlias.mjs';
import findEntryOfId from '#controllers/entry/findEntryOfId.mjs';
import updateEntry from '#controllers/entry/updateEntry.mjs';

export default async (entry, input) => {
  const data = {
    ...input,
  };
  let entryItem = findEntryOfId(entry);
  if (!entryItem) {
    throw createError(404);
  }
  if (typeof data.alias === 'string') {
    data.alias = data.alias.trim();
  }
  if (data.alias && data.alias !== entryItem.alias) {
    const matched = findEntryOfAlias(data.alias);
    if (matched) {
      throw createError(403, `\`${data.alias}\` alias alreay set`);
    }
  }
  entryItem = await updateEntry(entry, () => data);
  if (!entryItem) {
    throw createError(404);
  }
  return entryItem;
};
