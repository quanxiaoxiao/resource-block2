import { PassThrough } from 'node:stream';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import shelljs from 'shelljs';
import mongoose from 'mongoose';
import { wrapStreamRead } from '@quanxiaoxiao/node-utils';
import calcReousrceTempDir from '../../providers/calcReousrceTempDir.mjs';
import { encrypt } from '../../providers/cipher.mjs';
import store from '../../store/store.mjs';
import logger from '../../logger.mjs';
import findResource from './findResource.mjs';

const { getState, dispatch } = store;

export default (ctx, onDone, typeName) => {
  if (ctx.request && !ctx.signal.aborted) {
    ctx.request.body = new PassThrough();
    const block = new mongoose.Types.ObjectId();

    dispatch('streamInputList', (pre) => [...pre, {
      _id: block,
      size: 0,
      request: {
        path: ctx.request.path,
        headers: ctx.request.headers,
      },
      entry: ctx.entryItem._id,
      typeName,
      dateTimeActive: null,
      dateTimeCreate: ctx.request.dateTimeCreate,
    }]);
    logger.warn(`\`${ctx.entryItem._id.toString()}\` entry \`${block.toString()}\` block start receive stream`);
    const hash = crypto.createHash('sha256');
    const resourceTempPathname = calcReousrceTempDir(block);
    const ws = fs.createWriteStream(resourceTempPathname);
    const encode = encrypt(block.toString());
    encode.pipe(ws);

    ws.once('finish', async () => {
      if (ctx.response
        && ctx.response.body
        && ctx.response.body.writable) {
        const streamInputItem = getState().streamInputList.find((d) => d._id.equals(block));
        assert(!!streamInputItem);
        const resource = await onDone({
          sha256: hash.digest('hex'),
          entry: streamInputItem.entry,
          size: streamInputItem.size,
          block: streamInputItem._id,
          dateTimeCreate: streamInputItem.dateTimeCreate,
          dateTimeComplete: Date.now(),
          pathname: resourceTempPathname,
        });
        if (resource) {
          const data = await findResource(resource);
          if (data
            && ctx.response
            && ctx.response.body
            && ctx.response.body.writable) {
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
