import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { PassThrough } from 'node:stream';

import { select } from '@quanxiaoxiao/datav';
import { wrapStreamRead } from '@quanxiaoxiao/node-utils';

import getResourceById from '#controllers/resource/getResourceById.mjs';
import findStreamInput from '#controllers/streamInput/findStreamInput.mjs';
import removeStreamInput from '#controllers/streamInput/removeStreamInput.mjs';
import storeStreamInput from '#controllers/streamInput/storeStreamInput.mjs';
import updateStreamInput from '#controllers/streamInput/updateStreamInput.mjs';
import { encrypt } from '#providers/cipher.mjs';
import resourceType from '#types/resource.mjs';

export default (ctx, streamInput) => {
  const streamInputItem = findStreamInput(streamInput);
  assert(streamInputItem, 'Stream input item not found');
  ctx.request.body = new PassThrough();
  ctx.response = {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: new PassThrough(),
  };
  const ws = fs.createWriteStream(streamInputItem.pathname);
  const hash = crypto.createHash('sha256');
  const encode = encrypt(streamInputItem._id);

  encode.pipe(ws);

  const cleanup = () => {
    ws.removeAllListeners();
    encode.removeAllListeners();

    if (!encode.destroyed) {
      encode.unpipe(ws);
      encode.destroy();
    }

    if (!ws.destroyed) {
      ws.destroy();
    }

    process.nextTick(() => {
      removeStreamInput(streamInputItem._id);
    });
  };

  const handleDrain = () => {
    if (!ctx.signal.aborted
      && ctx.request.body
      && !ctx.request.body.destroyed
      && ctx.request.body.isPaused?.()) {
      ctx.request.body.resume();
    }
  };

  const handleFinish = async () => {
    try {
      ws.off('drain', handleDrain);

      updateStreamInput(streamInputItem._id, () => ({
        sha256: hash.digest('hex'),
        dateTimeStore: Date.now(),
      }));

      const storeResult = await storeStreamInput(streamInputItem._id);
      let resource = null;

      if (storeResult?.resource) {
        resource = await getResourceById(storeResult.resource);
      }

      if (!ctx.signal.aborted && ctx.response.body.writable) {
        if (resource) {
          const responseData = select({
            type: 'object',
            properties: resourceType,
          })(resource);
          ctx.response.body.end(JSON.stringify(responseData));
        } else {
          ctx.response.body.end();
        }
      }
    } catch (error) {
      console.error('Error in handleFinish:', error);
      cleanup();
      if (!ctx.signal.aborted && ctx.response.body.writable) {
        ctx.response.body.end();
      }
    }
  };

  const handleError = (error) => {
    console.error('Stream processing error:', error);
    cleanup();
    if (!ctx.signal.aborted && ctx.response.body.writable) {
      ctx.response.body.end();
    }
  };

  ws.on('drain', handleDrain);
  ws.once('finish', handleFinish);
  ws.on('error', handleError);
  encode.on('error', handleError);

  wrapStreamRead({
    stream: ctx.request.body,
    signal: ctx.signal,
    onAbort: () => handleError(new Error('Stream aborted')),
    onData: (chunk) => {
      try {
        hash.update(chunk);

        updateStreamInput(streamInputItem._id, (prev) => ({
          dateTimeActive: Date.now(),
          chunkSize: prev.chunkSize + chunk.length,
        }));

        return encode.write(chunk);
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    onEnd: () => {
      try {
        assert(!encode.writableEnded, 'Encode stream already ended');
        encode.end();
      } catch (error) {
        handleError(error);
      }
    },
    onError: handleError,
  });
};
