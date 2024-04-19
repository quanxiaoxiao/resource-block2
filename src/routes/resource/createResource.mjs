import fs from 'node:fs/promises';
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
    await Promise.all([
      BlockModel.updateOne(
        { _id: blockMatched._id },
        {
          $inc: { linkCount: 1 },
          timeUpdate: blockData.timeCreate,
        },
      ),
      fs.unlink(pathname),
    ]);
    resourceItem.block = blockMatched._id;
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
    const blockPathname = calcBlockPathname(resourceItem.block);
    try {
      await fs.stat(blockPathname);
      console.warn(`\`${blockPathname}\` block already exist`);
    } catch (error) {
      // ignore
    }
    await Promise.all([
      blockItem.save(),
      fs.rename(pathname, blockPathname),
    ]);
  }

  await resourceItem.save();

  return findResource(resourceItem._id);
};
