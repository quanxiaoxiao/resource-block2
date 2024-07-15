import { PassThrough } from 'node:stream';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert';
import fs from 'node:fs';
import mongoose from 'mongoose';
import shelljs from 'shelljs';
import { hasHttpBodyContent } from '@quanxiaoxiao/http-utils';
import { wrapStreamRead } from '@quanxiaoxiao/node-utils';
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
  if (!hasHttpBodyContent(ctx.request.headers)) {
    const resourceItem = new ResourceModel({
      name: ctx.request.query.name,
      entry: ctx.entryItem._id,
      timeCreate: ctx.request.dateTimeCreate,
      timeUpdate: ctx.request.dateTimeCreate,
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
    logger.warn(`\`${ctx.entryItem._id.toString()}\` handleStoreStreamBlockWithCreate \`${resourceItem._id.toString()}\` create resource with empty`);
    const data = await findResource(resourceItem._id);
    ctx.response = {
      data,
    };
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

    ws.once('finish', async () => {
      if (ctx.response
        && ctx.response.body
        && ctx.response.body.writable) {
        const streamInputItem = getState().streamInputList.find((d) => d._id.equals(block));
        assert(!!streamInputItem);
        const sha256 = hash.digest('hex');
        const blockMatched = await BlockModel.findOne({
          sha256,
        });
        const resourceItem = new ResourceModel({
          name: streamInputItem.name,
          entry: streamInputItem.entry,
          timeCreate: streamInputItem.timeCreate,
          timeUpdate: streamInputItem.timeUpdate,
        });
        if (blockMatched) {
          await BlockModel.updateOne(
            { _id: blockMatched._id },
            {
              $inc: { linkCount: 1 },
              timeUpdate: streamInputItem.timeCreate,
            },
          );
          logger.warn(`\`${blockMatched._id.toString()}\` block set link count \`${blockMatched.linkCount + 1}\``);
          resourceItem.block = blockMatched._id;
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
          await blockItem.save();
          logger.warn(`\`${blockItem._id.toString()}\` store block \`${blockPathname}\``);
        }
        await resourceItem.save();
        logger.warn(`\`${resourceItem._id.toString()}\` createResource \`${JSON.stringify({ name: resourceItem.name, entry: resourceItem.entry.toString() })}\``);
        const data = await findResource(resourceItem._id);
        if (ctx.response && ctx.response.body && ctx.response.body.writable) {
          if (ctx.routeMatched.select) {
            ctx.response.body.end(JSON.stringify(ctx.routeMatched.select(data)));
          } else {
            ctx.response.body.end(JSON.stringify(data));
          }
        }
      } else if (shelljs.test('-f', resourceTempPathname)) {
        shelljs.rm('-f', resourceTempPathname);
      }
      dispatch('streamInputList', (pre) => pre.filter((d) => !d._id.equals(block)));
    });

    dispatch('streamInputList', (pre) => [...pre, {
      _id: block,
      size: 0,
      name: ctx.request.query.name,
      entry: ctx.entryItem._id,
      typeName: 'create',
      dateTimeActive: null,
      timeCreate: ctx.request.dateTimeCreate,
      timeUpdate: ctx.request.dateTimeCreate,
    }]);

    wrapStreamRead({
      stream: ctx.request.body,
      signal: ctx.signal,
      onData: (chunk) => {
        hash.update(chunk);
        const len = chunk.length;
        dispatch('streamInputList', (pre) => pre.map((d) => {
          if (d._id.equals(block)) {
            return {
              ...d,
              dateTimeActive: Date.now(),
              size: d.size + len,
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
