import fs from 'node:fs';
import assert from 'node:assert';
import { Transform } from 'node:stream';
import { parseContentRange } from '@quanxiaoxiao/http-utils';
import { decrypt } from '../../providers/cipher.mjs';
import createStreamOutput from '../../controllers/streamOutput/createStreamOutput.mjs';
import updateStreamOutput from '../../controllers/streamOutput/updateStreamOutput.mjs';
import removeStreamOutput from '../../controllers/streamOutput/removeStreamOutput.mjs';

const BLOCK_SIZE = 16;

const getResourceBlockStream = (
  resourceItem,
  dateTimeCreate,
  range,
) => {
  const streamOutputItem = createStreamOutput({
    resource: resourceItem._id.toString(),
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
    assert(!!resourceName);
    if (ctx.request.params[0] === 'preview') {
      if (ctx.resourceItem.mime) {
        ctx.response.headers['Content-Type'] = ctx.resourceItem.mime;
      }
      ctx.response.headers['Content-Disposition'] = `inline; filename=${resourceName}`;
    } else {
      ctx.response.headers['Content-Disposition'] = `attachment; filename="${resourceName}"`;
    }
    if (ctx.request.headers.range) {
      const [start, end] = parseContentRange(ctx.request.headers.range, ctx.resourceItem.block.size);
      ctx.response.statusCode = 206;
      ctx.response.headers['accept-ranges'] = 'bytes';
      ctx.response.headers['content-range'] = `bytes ${start}-${end}/${ctx.resourceItem.block.size}`;
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
