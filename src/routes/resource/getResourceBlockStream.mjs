import fs from 'node:fs';
import { Transform } from 'node:stream';
import { decrypt } from '../../providers/cipher.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';

const BLOCK_SIZE = 16;

export default (resourceItem, range) => {
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
