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

const getResourceBlockStream = (
  resourceItem,
  dateTimeCreate,
  range,
) => {
  const streamOutputItem = createStreamOutput({
    resource: resourceItem._id.toString(),
    resourceRecord: resourceItem.record._id.toString(),
    block: resourceItem.block._id.toString(),
    blockSize: resourceItem.block.size,
  });

  const pass = new Transform({
    transform(chunk, encoding, callback) {
      updateStreamOutput(streamOutputItem._id, (pre) => ({
        chunkSize: pre.chunkSize + chunk.length,
        dateTimeActive: Date.now(),
      }));
      callback(null, chunk);
    },
  });

  pass.once('close', () => {
    removeStreamOutput(streamOutputItem._id);
  });

  if (range) {
    const [start, end] = range;
    const startCounter = Math.floor(start / BLOCK_SIZE);
    const offsetStart = start - startCounter * BLOCK_SIZE;
    let init = false;
    updateStreamOutput(streamOutputItem._id, () => ({
      range: [start, end],
    }));
    const transform = new Transform({
      transform(chunk, encoding, callback) {
        if (!init) {
          init = true;
          callback(null, chunk.slice(offsetStart));
        } else {
          callback(null, chunk);
        }
      },
    });

    const ws = fs.createReadStream(streamOutputItem.pathname, {
      start: offsetStart !== 0 ? startCounter * BLOCK_SIZE : start,
      end,
    });

    ws.pipe(decrypt(resourceItem.block._id, startCounter))
      .pipe(transform)
      .pipe(pass);
    return pass;
  }

  const ws = fs.createReadStream(streamOutputItem.pathname);

  const decodeStream = decrypt(resourceItem.block._id);
  ws.pipe(decodeStream).pipe(pass);
  return pass;
};

export default (ctx) => {
  if (ctx.resourceItem.block.size === 0) {
    ctx.response = {
      headers: {},
      body: Buffer.from([]),
    };
  } else if (!ctx.signal.aborted) {
    ctx.response = {
      headers: {},
    };
    const resourceName = ctx.resourceItem.name || ctx.resourceItem._id.toString();
    ctx.response.headers['Content-Disposition'] = contentDispostion(resourceName);
    if (/\/preview$/.test(ctx.request.pathname)) {
      if (ctx.resourceItem.mime) {
        ctx.response.headers['Content-Type'] = ctx.resourceItem.mime;
      } else if (/\.(\w+)$/.test(resourceName)) {
        const type = mime.getType(RegExp.$1);
        if (type) {
          ctx.response.headers['Content-Type'] = type;
        }
      }
      ctx.response.headers['Content-Disposition'] = ctx.response.headers['Content-Disposition'].replace(/^attachment/, 'inline');
    }
    if (ctx.request.headers.range) {
      const [start, end] = parseContentRange(ctx.request.headers.range, ctx.resourceItem.block.size);
      ctx.response.statusCode = 206;
      ctx.response.headers['Accept-Ranges'] = 'bytes';
      ctx.response.headers['Content-Range'] = `bytes ${start}-${end}/${ctx.resourceItem.block.size}`;
      if (start === end) {
        ctx.response.body = null;
      } else {
        ctx.response.body = getResourceBlockStream(
          ctx.resourceItem,
          ctx.request.dateTimeCreate,
          [start, end],
        );
      }
    } else {
      ctx.response.body = getResourceBlockStream(
        ctx.resourceItem,
        ctx.request.dateTimeCreate,
      );
    }
  }
};
