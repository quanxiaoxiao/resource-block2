import fs from 'node:fs';
import { Transform } from 'node:stream';

import { parseContentRange } from '@quanxiaoxiao/http-utils';
import contentDispostion from 'content-disposition';
import mime from 'mime';

import createStreamOutput from '../../controllers/streamOutput/createStreamOutput.mjs';
import removeStreamOutput from '../../controllers/streamOutput/removeStreamOutput.mjs';
import updateStreamOutput from '../../controllers/streamOutput/updateStreamOutput.mjs';
import { decrypt } from '../../providers/cipher.mjs';

const BLOCK_SIZE = 16;

const createProgressTracker = (streamOutputId) => {
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        updateStreamOutput(streamOutputId, (prev) => ({
          chunkSize: prev.chunkSize + chunk.length,
          dateTimeActive: Date.now(),
        }));
        callback(null, chunk);
      } catch (error) {
        callback(error);
      }
    },
  });
};

const createRangeTransform = (offsetStart) => {
  let isFirstChunk = true;

  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        if (isFirstChunk) {
          isFirstChunk = false;
          callback(null, chunk.slice(offsetStart));
        } else {
          callback(null, chunk);
        }
      } catch (error) {
        callback(error);
      }
    },
  });
};

const setupPreviewHeaders = (ctx, resourceName) => {
  const { resourceItem, response } = ctx;

  if (resourceItem.mime) {
    response.headers['Content-Type'] = resourceItem.mime;
  } else {
    const match = resourceName.match(/\.(\w+)$/);
    if (match) {
      const type = mime.getType(match[1]);
      if (type) {
        response.headers['Content-Type'] = type;
      }
    }
  }

  response.headers['Content-Disposition'] = response.headers['Content-Disposition'].replace(/^attachment/, 'inline');
};

const setupResponseHeaders = (ctx) => {
  const { resourceItem, request, response } = ctx;
  const resourceName = resourceItem.name || resourceItem._id.toString();

  response.headers['Content-Disposition'] = contentDispostion(resourceName);

  if (/\/preview$/.test(request.pathname)) {
    setupPreviewHeaders(ctx, resourceName);
  }
};

const createResourceBlockStream = async (resourceItem, range = null) => {
  const streamOutputItem = createStreamOutput({
    resource: resourceItem._id.toString(),
    resourceRecord: resourceItem.record._id.toString(),
    block: resourceItem.block._id.toString(),
    blockSize: resourceItem.block.size,
  });

  const progressTracker = createProgressTracker(streamOutputItem._id);

  const cleanup = () => {
    try {
      removeStreamOutput(streamOutputItem._id);
    } catch (error) {
      console.error('Failed to remove stream output:', error);
    }
  };

  progressTracker.once('close', cleanup);
  progressTracker.once('error', cleanup);

  try {
    if (range) {
      const [start, end] = range;
      const startCounter = Math.floor(start / BLOCK_SIZE);
      const offsetStart = start - startCounter * BLOCK_SIZE;

      updateStreamOutput(streamOutputItem._id, () => ({ range: [start, end] }));

      const readStart = offsetStart !== 0 ? startCounter * BLOCK_SIZE : start;
      const readStream = fs.createReadStream(streamOutputItem.pathname, {
        start: readStart,
        end,
      });

      const decryptStream = decrypt(resourceItem.block._id, startCounter);
      const rangeTransform = createRangeTransform(offsetStart);

      readStream
        .pipe(decryptStream)
        .pipe(rangeTransform)
        .pipe(progressTracker);

      return progressTracker;
    }
    const readStream = fs.createReadStream(streamOutputItem.pathname);
    const decryptStream = decrypt(resourceItem.block._id);

    readStream
      .pipe(decryptStream)
      .pipe(progressTracker);

    return progressTracker;
  } catch (error) {
    cleanup();
    throw error;
  }
};

const handleRangeRequest = async (ctx) => {
  const { request, response, resourceItem } = ctx;
  const [start, end] = parseContentRange(request.headers.range, resourceItem.block.size);

  response.statusCode = 206;
  response.headers['Accept-Ranges'] = 'bytes';
  response.headers['Content-Range'] = `bytes ${start}-${end}/${resourceItem.block.size}`;

  if (start === end) {
    response.body = null;
    return;
  }

  try {
    response.body = await createResourceBlockStream(resourceItem, [start, end]);
  } catch (error) {
    console.error('Failed to create range stream:', error);
    response.statusCode = 500;
    response.body = null;
  }
};

const handleFullRequest = async (ctx) => {
  const { response, resourceItem } = ctx;

  try {
    response.body = await createResourceBlockStream(resourceItem);
  } catch (error) {
    console.error('Failed to create full stream:', error);
    response.statusCode = 500;
    response.body = null;
  }
};

export default async (ctx) => {
  ctx.response = {
    headers: {},
    statusCode: 200,
  };

  if (ctx.resourceItem.block.size === 0) {
    ctx.response.body = Buffer.from([]);
    return;
  }

  if (ctx.signal?.aborted) {
    return;
  }

  try {
    setupResponseHeaders(ctx);

    if (ctx.request.headers.range) {
      await handleRangeRequest(ctx);
    } else {
      await handleFullRequest(ctx);
    }
  } catch (error) {
    console.error('Request processing error:', error);
    ctx.response.statusCode = 500;
    ctx.response.body = null;
  }
};
