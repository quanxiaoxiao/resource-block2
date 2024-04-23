import path from 'node:path';
import crypto from 'node:crypto';
import { PassThrough, Transform } from 'node:stream';
import { createWriteStream } from 'node:fs';
import mongoose from 'mongoose';
import curd from '@quanxiaoxiao/curd';
import store from '../../store/store.mjs';
import { encrypt } from '../../providers/cipher.mjs';

const { getState, dispatch } = store;

export default (ctx) => {
  const pass = new PassThrough();
  const hash = crypto.createHash('sha256');
  ctx.hash = hash;
  ctx.blockItem = {
    _id: new mongoose.Types.ObjectId(),
    sha256: null,
    size: 0,
    timeCreate: ctx.request.timeCreate,
    timeUpdate: ctx.request.timeCreate,
  };
  const block = ctx.blockItem._id.toString();
  ctx.resourcePathname = path.resolve(getState().block.tempDir, block);

  dispatch('streamInputList', (pre) => [...pre, {
    block,
    timeCreate: ctx.blockItem.timeCreate,
  }]);
  const ws = createWriteStream(ctx.resourcePathname);

  ws.once('close', () => {
    dispatch('streamInputList', (pre) => curd.remove(pre, (d) => d.block === block));
  });

  pass
    .pipe(new Transform({
      transform(chunk, encoding, callback) {
        ctx.blockItem.size += chunk.length;
        hash.update(chunk);
        callback(null, chunk);
      },
    }))
    .pipe(encrypt(ctx.blockItem._id.toString()))
    .pipe(ws);

  ctx.request.body = pass;
};
