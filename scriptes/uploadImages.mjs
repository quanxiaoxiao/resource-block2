import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import { httpRequest } from '@quanxiaoxiao/http-request';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';

const cookie = '_auth=BearereyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdW5sYW5kIiwic3ViIjoidHp0ZXN0IiwiZXhwIjoxNzIxODA2NzMyLCJ2ZXJzaW9uIjoiMjAyNDA0MTUxNTM4NTIiLCJpYXQiOjE3MTMxNjY3MzIsInJvbGVzIjpbIlVTRVIiLCJBRE1JTiIsIlNVUFBPUlQiXX0.ZL783G4XI4KUZUHme0Ng9kGUJkyulIJDyoGrlVPxz6A';

const host1 = {
  hostname: '192.168.100.181',
  port: 3381,
};

const resourceServerPort = 3000;

const upload = async (pathname, name) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: resourceServerPort,
    method: 'POST',
    path: `/upload?name=${name}`,
    body: fs.createReadStream(pathname),
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

const updateRemoteAvatarResource = async ({
  identificationName,
  resource,
}) => {
  const responseItem = await httpRequest({
    hostname: host1.hostname,
    port: host1.port,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    path: '/sunlandapi/admin/driver/updateNewImage',
    body: JSON.stringify({
      idNumber: identificationName,
      newImage: resource,
    }),
  });
  if (responseItem.statusCode !== 200) {
    console.log(responseItem.body.toString());
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

const dirname = path.resolve(process.cwd(), 'imgs');

const fileList = fs.readdirSync(dirname);

await fileList.reduce(async (acc, name) => {
  await acc;
  const matches = name.match(/^([0-9x]+)_(\w+)\.\w+$/i);
  if (matches) {
    const data = await upload(path.join(dirname, name), name);
    if (data) {
      const ret = await updateRemoteAvatarResource({
        identificationName: matches[1],
        resource: data._id,
      });
      console.log(ret);
    }
  }
}, Promise.resolve);
