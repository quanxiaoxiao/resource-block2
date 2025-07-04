import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { PassThrough } from 'node:stream';

import { select } from '@quanxiaoxiao/datav';
import { wrapStreamRead } from '@quanxiaoxiao/node-utils';

import getResourceById from '../../controllers/resource/getResourceById.mjs';
import findStreamInput from '../../controllers/streamInput/findStreamInput.mjs';
import removeStreamInput from '../../controllers/streamInput/removeStreamInput.mjs';
import storeStreamInput from '../../controllers/streamInput/storeStreamInput.mjs';
import updateStreamInput from '../../controllers/streamInput/updateStreamInput.mjs';
import { encrypt } from '../../providers/cipher.mjs';
import resourceType from '../../types/resource.mjs';

export default (ctx, streamInput) => {
  const streamInputItem = findStreamInput(streamInput);
  assert(streamInputItem);
  ctx.request.body = new PassThrough();
  const ws = fs.createWriteStream(streamInputItem.pathname);
  const hash = crypto.createHash('sha256');
  const encode = encrypt(streamInputItem._id);
  encode.pipe(ws);
  ctx.response = {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: new PassThrough(),
  };

  const handleDrain = () => {
    if (!ctx.signal.aborted
      && ctx.request.body
      && !ctx.request.body.destroyed
      && ctx.request.body.resume
      && ctx.request.body.isPaused()) {
      ctx.request.body.resume();
    }
  };

  ws.on('drain', handleDrain);

  ws.once('finish', () => {
    ws.off('drain', handleDrain);
    updateStreamInput(streamInputItem._id, () => ({
      sha256: hash.digest('hex'),
      dateTimeStore: Date.now(),
    }));
    storeStreamInput(streamInputItem._id)
      .then((ret) => {
        if (ret) {
          return getResourceById(ret.resource);
        }
        return null;
      })
      .then((ret) => {
        if (!ctx.signal.aborted && ctx.response.body.writable) {
          if (ret) {
            ctx.response.body.end(JSON.stringify(select({
              type: 'object',
              properties: resourceType,
            })(ret)));
          } else {
            ctx.response.body.end();
          }
        }
      });
  });

  const handleError = () => {
    ws.off('drain', handleDrain);
    if (!encode.destroyed) {
      encode.unpipe(ws);
      encode.destroy();
      process.nextTick(() => {
        if (!ws.destroyed) {
          ws.destroy();
        }
      });
    }
    process.nextTick(() => {
      removeStreamInput(streamInputItem._id);
    });
  };

  wrapStreamRead({
    stream: ctx.request.body,
    signal: ctx.signal,
    onAbort: handleError,
    onData: (chunk) => {
      hash.update(chunk);
      updateStreamInput(streamInputItem._id, (pre) => ({
        dateTimeActive: Date.now(),
        chunkSize: pre.chunkSize + chunk.length,
      }));
      return encode.write(chunk);
    },
    onEnd: () => {
      assert(!encode.writableEnded);
      encode.end();
    },
    onError: handleError,
  });
};
