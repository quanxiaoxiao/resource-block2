import fs from 'node:fs/promises';
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
    logger.warn(`\`${blockMatched._id.toString()}\` block link count \`${blockMatched.linkCount + 1}\``);
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
    try {
      await blockItem.save();
      const blockPathname = calcBlockPathname(blockItem._id.toString());
      const tempPathname = path.join(path.resolve(pathname, '..'), path.basename(blockPathname));
      shelljs.mv(
        pathname,
        tempPathname,
      );
      shelljs.mv(tempPathname, path.resolve(blockPathname, '..'));
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
      if (blockOtherItem) {
        resourceItem.block = blockOtherItem._id;
        logger.warn(`\`${blockItem._id.toString()}\` block link count \`${blockOtherItem.linkCount}\``);
      } else {
        logger.warn(error);
      }
      fs.unlink(pathname)
        .then(
          () => {},
          () => {},
        );
    }
  }

  logger.warn(`\`${resourceItem._id.toString()}\` createResource \`${JSON.stringify({ name, entry })}\``);

  await resourceItem.save();

  return findResource(resourceItem._id);
};
