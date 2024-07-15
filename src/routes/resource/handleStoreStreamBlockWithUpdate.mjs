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
      await ResourceModel.updateOne(
        {
          _id: resourceItem._id,
        },
        {
          $set: {
            block: emptyBlockItem._id,
            timeUpdate: ctx.request.dateTimeCreate,
          },
        },
      );
      const data = await findResource(resourceItem._id);
      logger.warn(`\`${resourceItem._id}\` set block with empty`);
      ctx.response = {
        data,
      };
    }
  } else {
    const typeName = 'update';
    await handleStoreStreamBlock(
      ctx,
      async (ret) => {
        const resourceItem = await findResource(ctx.resourceItem._id);
        if (!resourceItem) {
          if (shelljs.test('-f', ret.pathname)) {
            shelljs.rm('-f', ret.pathname);
          }
          return null;
        }
        if (ret.sha256 === resourceItem.block.sha256) {
          logger.warn(`\`${resourceItem._id.toString()}\` receive same block \`${ret.sha256}\``);
          if (shelljs.test('-f', ret.pathname)) {
            shelljs.rm('-f', ret.pathname);
          }
          return resourceItem._id;
        }
        const blockMatched = await BlockModel.findOne({
          sha256: ret.sha256,
        });
        if (blockMatched) {
          await Promise.all([
            BlockModel.updateOne(
              { _id: blockMatched._id },
              {
                $inc: { linkCount: 1 },
                timeUpdate: ret.timeCreate,
              },
            ),
            ResourceModel.updateOne(
              {
                _id: resourceItem._id,
              },
              {
                $set: {
                  timeUpdate: ret.timeCreate,
                  block: blockMatched._id,
                },
              },
            ),
          ]);
          logger.warn(`\`${blockMatched._id.toString()}\` block set link count \`${blockMatched.linkCount + 1}\``);
          if (shelljs.test('-f', ret.pathname)) {
            shelljs.rm('-f', ret.pathname);
          }
          return resourceItem._id;
        }
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
        await Promise.all([
          blockItem.save(),
          ResourceModel.updateOne(
            {
              _id: resourceItem._id,
            },
            {
              $set: {
                timeUpdate: ret.timeCreate,
                block: blockItem._id,
              },
            },
          ),
        ]);
        await resourceItem.save();
        logger.warn(`\`${blockItem._id.toString()}\` create block`);
        logger.warn(`\`${resourceItem._id.toString()}\` updateResource \`${JSON.stringify({ entry: resourceItem.entry.toString(), sha256: ret.sha256 })}\``);
        return resourceItem._id;
      },
      typeName,
    );
  }
};