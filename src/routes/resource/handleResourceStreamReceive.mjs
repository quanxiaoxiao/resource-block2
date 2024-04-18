import path from 'node:path';
import crypto from 'node:crypto';
import { PassThrough, Transform } from 'node:stream';
import { createWriteStream } from 'node:fs';
import mongoose from 'mongoose';
import store from '../../store/store.mjs';
import { encrypt } from '../../providers/cipher.mjs';

const { getState } = store;

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
  ctx.resourcePathname = path.resolve(getState().block.tempDir, ctx.blockItem._id.toString());
  const ws = createWriteStream(ctx.resourcePathname);
  const encode = encrypt(ctx.blockItem._id.toString());
  pass
    .pipe(new Transform({
      transform(chunk, encoding, callback) {
        ctx.blockItem.size += chunk.length;
        hash.update(chunk);
        callback(null, chunk);
      },
    }))
    .pipe(encode)
    .pipe(ws);
  ctx.request.body = pass;
};
