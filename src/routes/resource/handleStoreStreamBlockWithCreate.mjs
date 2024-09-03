import { hasHttpBodyContent } from '@quanxiaoxiao/http-utils';
import {
  Resource as ResourceModel,
  Block as BlockModel,
  ResourceRecord as ResourceRecordModel,
} from '../../models/index.mjs';
import calcEmptyBlockSha256 from '../../utilities/calcEmptyBlockSha256.mjs';
import createStreamInput from '../../controllers/streamInput/createStreamInput.mjs';
import logger from '../../logger.mjs';
import findResource from './findResource.mjs';
import handleStreamInput from './handleStreamInput.mjs';

export default async (ctx) => {
  if (!hasHttpBodyContent(ctx.request.headers)) {
    const resourceItem = new ResourceModel({
      name: ctx.request.query.name,
      entry: ctx.entryItem._id,
      dateTimeCreate: ctx.request.dateTimeCreate,
      timeUpdate: ctx.request.dateTimeCreate,
      timeAtFirstComplete: ctx.request.dateTimeCreate,
    });
    const emptyBlockItem = await BlockModel.findOneAndUpdate(
      {
        sha256: calcEmptyBlockSha256(),
      },
      {
        size: 0,
        timeUpdate: ctx.request.dateTimeCreate,
        $inc: { linkCount: 1 },
      },
      {
        setDefaultsOnInsert: true,
        new: true,
        upsert: true,
      },
    );
    resourceItem.block = emptyBlockItem._id;
    const resourceRecordItem = new ResourceRecordModel({
      block: resourceItem.block,
      resource: resourceItem._id,
      dateTimeCreate: resourceItem.dateTimeCreate,
      timeAtComplete: resourceItem.dateTimeCreate,
    });
    resourceItem.record = resourceRecordItem._id;
    await Promise.all([
      resourceItem.save(),
      resourceRecordItem.save(),
    ]);
    logger.warn(`\`${resourceItem._id.toString()}\` create resource with empty`);
    const data = await findResource(resourceItem._id);
    if (data) {
      ctx.response = {
        data,
      };
    }
  } else if (!ctx.signal.aborted) {
    const streamInputItem = createStreamInput({
      entry: ctx.entryItem._id.toString(),
      dateTime: ctx.request.dateTimeCreate,
      name: ctx.request.query.name,
      request: {
        path: ctx.request.path,
        headers: ctx.request.headers,
      },
    });
    await handleStreamInput(ctx, streamInputItem._id);
  }
};
