import fs from 'node:fs/promises';
import path from 'node:path';
import shelljs from 'shelljs';
import {
  Block as BlockModel,
  Resource as ResourceModel,
} from '../../models/index.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import findResource from './findResource.mjs';

export default async (
  resourceItem,
  {
    pathname,
    blockData,
  },
) => {
  const blockMatched = await BlockModel.findOne({
    sha256: blockData.sha256,
  });

  const blockOrigin = resourceItem.block._id;

  if (blockMatched) {
    await Promise.all([
      BlockModel.updateOne(
        { _id: blockMatched._id },
        {
          $inc: { linkCount: 1 },
          timeUpdate: blockData.timeCreate,
        },
      ),
      ResourceModel.updateOne(
        {
          _id: resourceItem._id,
        },
        {
          $set: {
            timeUpdate: blockData.timeUpdate,
            block: blockMatched._id,
          },
        },
      ),
      fs.unlink(pathname),
    ]);
  } else {
    const blockItem = new BlockModel({
      _id: blockData._id,
      sha256: blockData.sha256,
      size: blockData.size,
      timeCreate: blockData.timeCreate,
      timeUpdate: blockData.timeCreate,
      linkCount: 1,
    });
    const blockPathname = calcBlockPathname(blockItem._id.toString());
    const tempPathname = path.join( path.resolve(pathname, '..'), path.basename(blockPathname));
    shelljs.mv(
      pathname,
      tempPathname,
    );
    shelljs.mv(tempPathname, path.resolve(blockPathname, '..'));
    await Promise.all([
      ResourceModel.updateOne(
        {
          _id: resourceItem._id,
        },
        {
          $set: {
            timeUpdate: blockData.timeUpdate,
            block: blockItem._id,
          },
        },
      ),
      BlockModel.updateOne(
        {
          _id: blockOrigin,
          linkCount: {
            $gte: 1,
          },
        },
        {
          $inc: { linkCount: -1 },
        },
      ),
      blockItem.save(),
    ]);
  }

  return findResource(resourceItem._id);
};
