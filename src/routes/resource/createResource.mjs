import fs from 'node:fs/promises';
import assert from 'node:assert';
import shelljs from 'shelljs';
import path from 'node:path';
import logger from '../../logger.mjs';
import {
  Resource as ResourceModel,
  Block as BlockModel,
} from '../../models/index.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import findResource from './findResource.mjs';

export default async ({
  name,
  entry,
  blockData,
  pathname,
  socket,
}) => {
  const blockMatched = await BlockModel.findOne({
    sha256: blockData.sha256,
  });
  const resourceItem = new ResourceModel({
    name,
    entry,
    timeCreate: blockData.timeCreate,
    timeUpdate: blockData.timeUpdate,
  });
  if (blockMatched) {
    await BlockModel.updateOne(
      { _id: blockMatched._id },
      {
        $inc: { linkCount: 1 },
        timeUpdate: blockData.timeCreate,
      },
    );
    logger.warn(`\`${blockMatched._id.toString()}\` block set link count \`${blockMatched.linkCount + 1}\``);
    resourceItem.block = blockMatched._id;
    fs.unlink(pathname)
      .then(
        () => {},
        () => {},
      );
  } else {
    const blockItem = new BlockModel({
      _id: blockData._id,
      sha256: blockData.sha256,
      size: blockData.size,
      timeCreate: blockData.timeCreate,
      timeUpdate: blockData.timeCreate,
      linkCount: 1,
    });
    resourceItem.block = blockItem._id;
    await fs.stat(pathname);
    assert(socket.writable);
    try {
      const blockPathname = calcBlockPathname(blockItem._id.toString());
      const tempPathname = path.join(path.resolve(pathname, '..'), path.basename(blockPathname));
      shelljs.mv(
        pathname,
        tempPathname,
      );
      shelljs.mv(tempPathname, path.resolve(blockPathname, '..'));
      await fs.stat(blockPathname);
      await blockItem.save();
      logger.warn(`\`${blockItem._id.toString()}\` store block \`${blockPathname}\``);
    } catch (error) {
      const blockOtherItem = await BlockModel.findOneAndUpdate(
        {
          sha256: blockData.sha256,
        },
        {
          $inc: { linkCount: 1 },
          timeUpdate: blockData.timeCreate,
        },
        {
          new: true,
        },
      );
      fs.unlink(pathname)
        .then(
          () => {},
          () => {},
        );
      if (!blockOtherItem) {
        throw error;
      }
      resourceItem.block = blockOtherItem._id;
      logger.warn(`\`${blockItem._id.toString()}\` block set link count \`${blockOtherItem.linkCount}\``);
    }
  }

  logger.warn(`\`${resourceItem._id.toString()}\` createResource \`${JSON.stringify({ name, entry })}\``);

  await resourceItem.save();

  return findResource(resourceItem._id);
};
