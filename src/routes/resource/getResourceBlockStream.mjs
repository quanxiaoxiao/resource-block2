import fs from 'node:fs';
import { Transform } from 'node:stream';
import curd from '@quanxiaoxiao/curd';
import store from '../../store/store.mjs';
import { decrypt } from '../../providers/cipher.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';

const BLOCK_SIZE = 16;

const { dispatch } = store;

export default (resourceItem, timeCreate, range) => {
  const pathname = calcBlockPathname(resourceItem.block._id);

  const resource = resourceItem._id.toString();
  const block = resourceItem.block._id.toString();

  dispatch('streamOutputList', (pre) => [...pre, {
    timeCreate,
    resource,
    block,
  }]);

  const handleCloseOnStream = () => {
    dispatch('streamOutputList', (pre) => curd.remove(pre, (d) => d.resource === resource));
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

    const rs = fs.createReadStream(pathname, {
      start: offsetStart !== 0 ? startCounter * BLOCK_SIZE : start,
      end,
    });

    rs.once('close', handleCloseOnStream);

    return rs
      .pipe(decrypt(resourceItem.block._id, startCounter))
      .pipe(transform);
  }

  const rs = fs.createReadStream(pathname);
  rs.once('close', handleCloseOnStream);

  return rs
    .pipe(decrypt(resourceItem.block._id));
};
