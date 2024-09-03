import path from 'node:path';
import assert from 'node:assert';
import shelljs from 'shelljs';
import logger from '../../logger.mjs';
import { STREAM_TYPE_RESOURCE_CREATE } from '../../constants.mjs';
import {
  Resource as ResourceModel,
  Block as BlockModel,
} from '../../models/index.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import findStreamInput from './findStreamInput.mjs';
import removeStreamInput from './removeStreamInput.mjs';

export default async (streamInput) => {
  const streamInputItem = findStreamInput(streamInput);
  if (!streamInputItem) {
    return null;
  }
  assert(streamInputItem.sha256 != null);
  assert(streamInputItem.dateTimeStore != null);
  let resourceItem;
  if (streamInputItem.type === STREAM_TYPE_RESOURCE_CREATE) {
    resourceItem = new ResourceModel({
      _id: streamInputItem.resource,
      name: streamInputItem.name,
      entry: streamInputItem.entry,
      dateTimeCreate: streamInputItem.dateTimeCreate,
      timeUpdate: streamInputItem.timeUpdate,
      dateTimeStore: streamInputItem.dateTimeStore,
    });
  } else {
    resourceItem = await ResourceModel.findOne({
      _id: streamInputItem.resource,
      invalid: {
        $ne: true,
      },
    });
    if (!resourceItem) {
      removeStreamInput(streamInputItem._id);
      return null;
    }
  }
  const blockMatched = await BlockModel.findOne({
    sha256: streamInputItem.sha256,
  });
  if (blockMatched) {
    await BlockModel.updateOne(
      { _id: blockMatched._id },
      {
        $inc: { linkCount: 1 },
        timeUpdate: streamInputItem.dateTimeCreate,
      },
    );
    logger.warn(`\`${blockMatched._id.toString()}\` block set link count \`${blockMatched.linkCount + 1}\``);
    resourceItem.block = blockMatched._id;
    if (shelljs.test('-f', streamInputItem.pathname)) {
      shelljs.rm('-f', streamInputItem.pathname);
    }
  } else {
    const blockItem = new BlockModel({
      _id: streamInputItem._id,
      sha256: streamInputItem.sha256,
      size: streamInputItem.chunkSize,
      dateTimeCreate: streamInputItem.dateTimeCreate,
      timeUpdate: streamInputItem.dateTimeCreate,
      linkCount: 1,
    });
    resourceItem.block = blockItem._id;
    const blockPathname = calcBlockPathname(streamInputItem._id);
    const tempPathname = path.join(path.resolve(streamInputItem.pathname, '..'), path.basename(blockPathname));
    shelljs.mv(
      streamInputItem.pathname,
      tempPathname,
    );
    shelljs.mv(tempPathname, path.resolve(blockPathname, '..'));
    await blockItem.save();
    logger.warn(`\`${blockItem._id.toString()}\` create block \`chunkSize:${blockItem.size}\``);
    resourceItem.block = blockItem._id;
  }
  await resourceItem.save();
  removeStreamInput(streamInputItem._id);
  return streamInputItem;
};
