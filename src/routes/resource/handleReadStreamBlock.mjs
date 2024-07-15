import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert';
import { Transform } from 'node:stream';
import store from '../../store/store.mjs';
import { decrypt } from '../../providers/cipher.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import parseContentRange from '../../utilities/parseContentRange.mjs';

const BLOCK_SIZE = 16;

const { dispatch } = store;

const getResourceBlockStream = (
  resourceItem,
  timeCreate,
  range,
) => {
  const pathname = calcBlockPathname(resourceItem.block._id);
  const uuid = crypto.randomUUID();
  dispatch('streamOutputList', (pre) => [...pre, {
    uuid,
    timeCreate,
    timeEnd: null,
    resource: resourceItem._id,
  }]);

  const handleCloseOnReadStream = () => {
    dispatch('streamOutputList', (pre) => pre.map((d) => {
      if (d.uuid === uuid) {
        return {
          ...d,
          timeEnd: Date.now(),
        };
      }
      return d;
    }));
  };

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

    const ws = fs.createReadStream(pathname, {
      start: offsetStart !== 0 ? startCounter * BLOCK_SIZE : start,
      end,
    });

    transform.once('close', handleCloseOnReadStream);

    return ws
      .pipe(decrypt(resourceItem.block._id, startCounter))
      .pipe(transform);
  }

  const ws = fs.createReadStream(pathname);

  const decodeStream = decrypt(resourceItem.block._id);

  decodeStream.once('close', handleCloseOnReadStream);

  return ws
    .pipe(decodeStream);
};

export default (ctx) => {
  if (ctx.resourceItem.block.size === 0) {
    dispatch('streamOutputList', (pre) => [...pre, {
      uuid: crypto.randomUUID(),
      timeCreate: ctx.request.dateTimeCreate,
      timeEnd: Date.now(),
      resource: ctx.resourceItem._id,
    }]);
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
