import createError from 'http-errors';
import findEntryOfId from '../../controllers/entry/findEntryOfId.mjs';
import findResource from './findResource.mjs';

export default async (ctx) => {
  if (ctx.request.params && ctx.request.params.resource) {
    const resourceItem = await findResource(ctx.request.params.resource);
    if (!resourceItem) {
      throw createError(404);
    }
    const entryItem = findEntryOfId(resourceItem.entry.toString());
    if (!entryItem) {
      throw createError(404);
    }
    if (ctx.request.method !== 'GET' && entryItem.readOnly) {
      throw createError(403, 'entry is read only');
    }
    ctx.entryItem = entryItem;
    ctx.resourceItem = resourceItem;
  }
};
