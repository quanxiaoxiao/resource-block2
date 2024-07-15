import fs from 'node:fs';
import assert from 'node:assert';
import { Transform } from 'node:stream';
import { decrypt } from '../../providers/cipher.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import parseContentRange from '../../utilities/parseContentRange.mjs';

const BLOCK_SIZE = 16;

const getResourceBlockStream = (
  resourceItem,
  timeCreate,
  range,
) => {
  const pathname = calcBlockPathname(resourceItem.block._id);

  if (range) {
    const [start, end] = range;
    const startCounter = Math.floor(start / BLOCK_SIZE);
    const offsetStart = start - startCounter * BLOCK_SIZE;
    let init = false;
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

    return fs.createReadStream(pathname, {
      start: offsetStart !== 0 ? startCounter * BLOCK_SIZE : start,
      end,
    })
      .pipe(decrypt(resourceItem.block._id, startCounter))
      .pipe(transform);
  }

  return fs.createReadStream(pathname)
    .pipe(decrypt(resourceItem.block._id));
};

export default (ctx) => {
  if (ctx.resourceItem.block.size === 0) {
    ctx.response = {
      headers: {},
      body: Buffer.from([]),
    };
  } else {
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
          ctx.request.timeCreate,
          [start, end],
        );
      }
    } else {
      ctx.response.body = getResourceBlockStream(
        ctx.resourceItem,
        ctx.request.timeCreate,
      );
    }
  }
};
