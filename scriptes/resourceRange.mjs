import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { httpRequest } from '@quanxiaoxiao/http-request';
import { sha256 } from '@quanxiaoxiao/node-utils';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';

const upload = async (buf) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'POST',
    path: '/upload',
    body: buf,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

const packageBuf = fs.readFileSync(path.resolve(process.cwd(), 'package-lock.json'));

const ret = await upload(packageBuf);

assert.equal(ret.size, packageBuf.length);

assert.equal(
  ret.hash,
  sha256(packageBuf),
);

const aaa = await httpRequest({
  hostname: '127.0.0.1',
  port: 4059,
  path: `/resource/${ret._id}`,
});

assert.equal(sha256(aaa.body), ret.hash);

const range = [31, 55];

const bbb = await httpRequest({
  hostname: '127.0.0.1',
  port: 4059,
  headers: {
    range: `bytes=${range[0]}-${range[1]}`,
  },
  path: `/resource/${ret._id}`,
});

assert(
  sha256(bbb.body),
  sha256(packageBuf.slice(range[0], range[1] + 1)),
);

const ccc = await httpRequest({
  hostname: '127.0.0.1',
  port: 4059,
  headers: {
    range: `bytes=${range[0]}-`,
  },
  path: `/resource/${ret._id}`,
});

assert(
  sha256(ccc.body),
  sha256(packageBuf.slice(range[0])),
);
