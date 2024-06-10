import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { sha256 } from '@quanxiaoxiao/node-utils';
import {
  upload,
  fetchResourceChunk,
} from './apis.mjs';

const packageBuf = fs.readFileSync(path.resolve(process.cwd(), 'package-lock.json'));

const ret = await upload({
  content: packageBuf,
});

assert.equal(ret.size, packageBuf.length);

assert.equal(
  ret.hash,
  sha256(packageBuf),
);

const resourceChunk = await fetchResourceChunk(ret._id);

assert.equal(sha256(resourceChunk), ret.hash);

const range = [31, 55];

const resourceRangeChunk = await fetchResourceChunk(ret._id, range);

assert(
  sha256(resourceRangeChunk),
  sha256(packageBuf.slice(range[0], range[1] + 1)),
);

const resourceRangeChunk2 = await fetchResourceChunk(ret._id, [range[0]]);

assert(
  sha256(resourceRangeChunk2),
  sha256(packageBuf.slice(range[0])),
);
