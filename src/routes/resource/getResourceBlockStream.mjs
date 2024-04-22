import fs from 'node:fs';
import { decrypt } from '../../providers/cipher.mjs';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';

export default (resourceItem) => {
  const pathname = calcBlockPathname(resourceItem.block._id);
  const dechipher = decrypt(resourceItem.block._id);

  const stream = fs.createReadStream(pathname);

  return stream
    .pipe(dechipher);
};
