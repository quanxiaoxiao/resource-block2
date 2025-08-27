import { select } from '@quanxiaoxiao/datav';
import { hasHttpBodyContent } from '@quanxiaoxiao/http-utils';
import contentDisposition from 'content-disposition';

import { STREAM_TYPE_RESOURCE_UPDATE } from '#constants.mjs';
import getResourceById from '#controllers/resource/getResourceById.mjs';
import createStreamInput from '#controllers/streamInput/createStreamInput.mjs';
import logger from '#logger.mjs';
import {
  Block as BlockModel,
  Resource as ResourceModel,
  ResourceRecord as ResourceRecordModel,
} from '#models.mjs';
import resourceType from '#types/resource.mjs';
import calcEmptyBlockSha256 from '#utilities/calcEmptyBlockSha256.mjs';

import handleStreamInput from './handleStreamInput.mjs';

const selectData = (data) => select({
  type: 'object',
  properties: resourceType,
})(data);

const getResourceName = (ctx) => {
  const contentDispositionHeader = ctx.request.headers['content-disposition'];
  if (!contentDispositionHeader) {
    return null;
  }

  try {
    const parsed = contentDisposition.parse(contentDispositionHeader);
    if (parsed.type === 'attachment' && parsed.parameters?.filename) {
      return parsed.parameters.filename;
    }
  } catch (error) {
    logger.warn('Failed to parse content-disposition header', error);
  }

  return null;
};

const getRemoteAddress = (ctx) => {
  return ctx.request.headers['x-remote-address']?.toString() ?? ctx.socket.remoteAddress;
};

const getUserAgent = (ctx) => {
  return ctx.request.headers['user-agent']?.toString() ?? null;
};

export default async (ctx) => {
  if (!hasHttpBodyContent(ctx.request.headers)) {
    const { resourceItem } = ctx;
    if (resourceItem.block.size === 0) {
      logger.warn(`\`${resourceItem._id}\` set block with empty`);
      ctx.response = {
        data: selectData(resourceItem),
      };
    } else {
      const [emptyBlockItem] = await Promise.all([
        BlockModel.findOneAndUpdate(
          {
            sha256: calcEmptyBlockSha256(),
          },
          {
            size: 0,
            dateTimeUpdate: ctx.request.dateTimeCreate,
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
        dateTimeCreate: ctx.request.dateTimeCreate,
        userAgent: getUserAgent(ctx),
        remoteAddress: getRemoteAddress(ctx),
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
              name: getResourceName(ctx) || ctx.resourceItem.name,
              block: emptyBlockItem._id,
              dateTimeUpdate: ctx.request.dateTimeCreate,
            },
          },
        ),
      ]);
      logger.warn(`\`${resourceItem._id}\` set block with empty`);
      const data = await getResourceById(resourceItem._id);
      if (data) {
        ctx.response = {
          data: selectData(data),
        };
      }
    }
  } else if (!ctx.signal.aborted) {
    const streamInputItem = createStreamInput({
      entry: ctx.entryItem._id.toString(),
      resource: ctx.resourceItem._id.toString(),
      name: getResourceName(ctx) || ctx.resourceItem.name,
      remoteAddress: getRemoteAddress(ctx),
      type: STREAM_TYPE_RESOURCE_UPDATE,
      request: {
        path: ctx.request.path,
        headers: ctx.request.headers,
      },
    });
    await handleStreamInput(ctx, streamInputItem._id);
  }
};
