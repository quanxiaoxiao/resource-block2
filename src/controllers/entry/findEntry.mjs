import { isValidObjectId } from '@quanxiaoxiao/mongo';

import findEntryOfAlias from './findEntryOfAlias.mjs';
import findEntryOfId  from './findEntryOfId.mjs';

export default (entry) => {
  if (isValidObjectId(entry)) {
    return findEntryOfId(entry);
  }
  if (!entry) {
    return null;
  }
  const alias = entry.trim();
  if (!alias) {
    return null;
  }
  return findEntryOfAlias(alias);
};
