import path from 'node:path';
import shelljs from 'shelljs';
import { hasHttpBodyContent } from '@quanxiaoxiao/http-utils';
import {
  Resource as ResourceModel,
  Block as BlockModel,
} from '../../models/index.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import calcEmptyBlockSha256 from '../../utilities/calcEmptyBlockSha256.mjs';
import logger from '../../logger.mjs';
import findResource from './findResource.mjs';
import handleStoreStreamBlock from './handleStoreStreamBlock.mjs';

export default async (ctx) => {
  if (!hasHttpBodyContent(ctx.request.headers)) {
    const resourceItem = new ResourceModel({
      name: ctx.request.query.name,
      entry: ctx.entryItem._id,
      timeCreate: ctx.request.dateTimeCreate,
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
    await resourceItem.save();
    logger.warn(`\`${resourceItem._id.toString()}\` create resource with empty`);
    const data = await findResource(resourceItem._id);
    if (data) {
      ctx.response = {
        data,
      };
    }
  } else {
    const typeName = 'create';
    await handleStoreStreamBlock(
      ctx,
      async (ret) => {
        const blockMatched = await BlockModel.findOne({
          sha256: ret.sha256,
        });
        const resourceItem = new ResourceModel({
          name: ctx.request.query.name,
          entry: ret.entry,
          timeCreate: ret.timeCreate,
          timeUpdate: ret.timeCreate,
          timeAtFirstComplete: ret.timeAtComplete,
        });
        if (blockMatched) {
          await BlockModel.updateOne(
            { _id: blockMatched._id },
            {
              $inc: { linkCount: 1 },
              timeUpdate: ret.timeCreate,
            },
          );
          logger.warn(`\`${blockMatched._id.toString()}\` block set link count \`${blockMatched.linkCount + 1}\``);
          resourceItem.block = blockMatched._id;
          if (shelljs.test('-f', ret.pathname)) {
            shelljs.rm('-f', ret.pathname);
          }
        } else {
          const blockItem = new BlockModel({
            _id: ret.block,
            sha256: ret.sha256,
            size: ret.size,
            timeCreate: ret.timeCreate,
            timeUpdate: ret.timeCreate,
            linkCount: 1,
          });
          resourceItem.block = blockItem._id;
          const blockPathname = calcBlockPathname(blockItem._id.toString());
          const tempPathname = path.join(path.resolve(ret.pathname, '..'), path.basename(blockPathname));
          shelljs.mv(
            ret.pathname,
            tempPathname,
          );
          shelljs.mv(tempPathname, path.resolve(blockPathname, '..'));
          await blockItem.save();
          logger.warn(`\`${blockItem._id.toString()}\` create block`);
        }
        await resourceItem.save();
        logger.warn(`\`${resourceItem._id.toString()}\` createResource \`${JSON.stringify({ name: resourceItem.name, entry: resourceItem.entry.toString(), sha256: ret.sha256 })}\``);
        return resourceItem._id;
      },
      typeName,
    );
  }
};
