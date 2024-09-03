import { hasHttpBodyContent } from '@quanxiaoxiao/http-utils';
import {
  Resource as ResourceModel,
  Block as BlockModel,
  ResourceRecord as ResourceRecordModel,
} from '../../models/index.mjs';
import { STREAM_TYPE_RESOURCE_UPDATE } from '../../constants.mjs';
import calcEmptyBlockSha256 from '../../utilities/calcEmptyBlockSha256.mjs';
import logger from '../../logger.mjs';
import findResource from './findResource.mjs';
import createStreamInput from '../../controllers/streamInput/createStreamInput.mjs';
import handleStreamInput from './handleStreamInput.mjs';

export default async (ctx) => {
  if (!hasHttpBodyContent(ctx.request.headers)) {
    const { resourceItem } = ctx;
    if (resourceItem.block.size === 0) {
      logger.warn(`\`${resourceItem._id}\` set block with empty`);
      ctx.response = {
        data: resourceItem,
      };
    } else {
      const [emptyBlockItem] = await Promise.all([
        BlockModel.findOneAndUpdate(
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
        ),
        BlockModel.updateOne(
          {
            _id: resourceItem.block._id,
          },
          {
            $inc: { linkCount: -1 },
          },
        ),
      ]);
      const resourceRecordItem = new ResourceRecordModel({
        block: resourceItem.block._id,
        resource: resourceItem._id,
        timeCreate: ctx.request.dateTimeCreate,
        timeAtComplete: ctx.request.dateTimeCreate,
      });
      await Promise.all([
        resourceRecordItem.save(),
        ResourceModel.updateOne(
          {
            _id: resourceItem._id,
          },
          {
            $set: {
              record: resourceRecordItem._id,
              block: emptyBlockItem._id,
              timeUpdate: ctx.request.dateTimeCreate,
            },
          },
        ),
      ]);
      logger.warn(`\`${resourceItem._id}\` set block with empty`);
      const data = await findResource(resourceItem._id);
      if (data) {
        ctx.response = {
          data,
        };
      }
    }
  } else if (!ctx.signal.aborted) {
    const streamInputItem = createStreamInput({
      entry: ctx.entryItem._id.toString(),
      resource: ctx.resourceItem._id.toString(),
      dateTime: ctx.request.dateTimeCreate,
      name: ctx.resourceItem.name,
      type: STREAM_TYPE_RESOURCE_UPDATE,
      request: {
        path: ctx.request.path,
        headers: ctx.request.headers,
      },
    });
    await handleStreamInput(ctx, streamInputItem._id);
  }
};
