import { PassThrough } from 'node:stream';
import path from 'node:path';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import mongoose from 'mongoose';
import shelljs from 'shelljs';
import { wrapStreamRead } from '@quanxiaoxiao/node-utils';
import { hasHttpBodyContent } from '@quanxiaoxiao/http-utils';
import {
  Resource as ResourceModel,
  Block as BlockModel,
} from '../../models/index.mjs';
import calcReousrceTempDir from '../../providers/calcReousrceTempDir.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import calcEmptyBlockSha256 from '../../utilities/calcEmptyBlockSha256.mjs';
import store from '../../store/store.mjs';
import logger from '../../logger.mjs';
import { encrypt } from '../../providers/cipher.mjs';
import findResource from './findResource.mjs';

const { getState, dispatch } = store;

export default async (ctx) => {
  const { resourceItem } = ctx;
  if (!hasHttpBodyContent(ctx.request.headers)) {
    if (resourceItem.block.size === 0) {
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
      ctx.response = {
        data,
      };
    }
  } else {
    const pass = new PassThrough();
    const hash = crypto.createHash('sha256');
    ctx.request.body = pass;
    const block = new mongoose.Types.ObjectId();
    const resourceTempPathname = calcReousrceTempDir(block);
    const ws = fs.createWriteStream(resourceTempPathname);
    logger.warn(`\`${ctx.entryItem._id.toString()}\` entry \`${block.toString()}\` block start receive stream`);
    const encode = encrypt(block.toString());
    encode.pipe(ws);

    dispatch('streamInputList', (pre) => [...pre, {
      _id: block,
      size: 0,
      request: {
        path: ctx.request.path,
        headersRaw: ctx.request.headersRaw,
        dateTimeCreate: ctx.request.dateTimeCreate,
      },
      name: ctx.resourceItem.name,
      entry: ctx.entryItem._id,
      typeName: 'update',
      dateTimeActive: null,
      timeCreate: ctx.request.dateTimeCreate,
      timeUpdate: ctx.request.dateTimeCreate,
    }]);

    ws.once('finish', async () => {
      if (ctx.response
        && ctx.response.body
        && ctx.response.body.writable) {
        const streamInputItem = getState().streamInputList.find((d) => d._id.equals(block));
        assert(!!streamInputItem);
        const sha256 = hash.digest('hex');
        if (sha256 === resourceItem.block.sha256) {
          if (shelljs.test('-f', resourceTempPathname)) {
            shelljs.rm('-f', resourceTempPathname);
          }
          if (ctx.response && ctx.response.body && ctx.response.body.writable) {
            if (ctx.routeMatched.select) {
              ctx.response.body.end(JSON.stringify(ctx.routeMatched.select(resourceItem)));
            } else {
              ctx.response.body.end(JSON.stringify(resourceItem));
            }
          }
        } else {
          const blockMatched = await BlockModel.findOne({
            sha256,
          });
          if (blockMatched) {
            await Promise.all([
              BlockModel.updateOne(
                { _id: blockMatched._id },
                {
                  $inc: { linkCount: 1 },
                  timeUpdate: streamInputItem.timeCreate,
                },
              ),
              ResourceModel.updateOne(
                {
                  _id: resourceItem._id,
                },
                {
                  $set: {
                    timeUpdate: streamInputItem.timeCreate,
                    block: blockMatched._id,
                  },
                },
              ),
            ]);
            logger.warn(`\`${blockMatched._id.toString()}\` block set link count \`${blockMatched.linkCount + 1}\``);
            if (shelljs.test('-f', resourceTempPathname)) {
              shelljs.rm('-f', resourceTempPathname);
            }
          } else {
            const blockItem = new BlockModel({
              _id: streamInputItem._id,
              sha256,
              size: streamInputItem.size,
              timeCreate: streamInputItem.timeCreate,
              timeUpdate: streamInputItem.timeCreate,
              linkCount: 1,
            });
            resourceItem.block = blockItem._id;
            const blockPathname = calcBlockPathname(blockItem._id.toString());
            const tempPathname = path.join(path.resolve(resourceTempPathname, '..'), path.basename(blockPathname));
            shelljs.mv(
              resourceTempPathname,
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
                    timeUpdate: streamInputItem.timeCreate,
                    block: blockItem._id,
                  },
                },
              ),
            ]);
            await blockItem.save();
            logger.warn(`\`${blockItem._id.toString()}\` store block \`${blockPathname}\``);
          }
          // logger.warn(`\`${resourceItem._id.toString()}\` createResource \`${JSON.stringify({ name: resourceItem.name, entry: resourceItem.entry.toString() })}\``);
          const data = await findResource(resourceItem._id);
          if (ctx.response && ctx.response.body && ctx.response.body.writable) {
            if (ctx.routeMatched.select) {
              ctx.response.body.end(JSON.stringify(ctx.routeMatched.select(data)));
            } else {
              ctx.response.body.end(JSON.stringify(data));
            }
          }
        }
      } else if (shelljs.test('-f', resourceTempPathname)) {
        shelljs.rm('-f', resourceTempPathname);
      }
      dispatch('streamInputList', (pre) => pre.filter((d) => !d._id.equals(block)));
    });

    wrapStreamRead({
      stream: ctx.request.body,
      signal: ctx.signal,
      onData: (chunk) => {
        hash.update(chunk);
        dispatch('streamInputList', (pre) => pre.map((d) => {
          if (d._id.equals(block)) {
            return {
              ...d,
              dateTimeActive: Date.now(),
              size: d.size + chunk.length,
            };
          }
          return d;
        }));
        return encode.write(chunk);
      },
      onEnd: () => {
        assert(!encode.writableEnded);
        ctx.response = {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: new PassThrough(),
        };
        encode.end();
      },
      onError: () => {
        if (!encode.writableEnded) {
          encode.end();
        }
      },
    });
  }
};
