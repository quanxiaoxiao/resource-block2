import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import { Semaphore } from '@quanxiaoxiao/utils';
import request from '@quanxiaoxiao/http-request';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';

const sem = new Semaphore(24);

const cookie = '_auth=BearereyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdW5sYW5kIiwic3ViIjoidHp0ZXN0IiwiZXhwIjoxNzIxODA2NzMyLCJ2ZXJzaW9uIjoiMjAyNDA0MTUxNTM4NTIiLCJpYXQiOjE3MTMxNjY3MzIsInJvbGVzIjpbIlVTRVIiLCJBRE1JTiIsIlNVUFBPUlQiXX0.ZL783G4XI4KUZUHme0Ng9kGUJkyulIJDyoGrlVPxz6A';

const host1 = {
  hostname: '192.168.100.181',
  port: 3381,
};

const resourceServerPort = 4059;

const httpRequest = ({
  hostname,
  port,
  ...options
}) => request(
  options,
  {
    hostname,
    port,
  },
);

const upload = async (pathname, name) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: resourceServerPort,
    method: 'POST',
    path: `/upload/driver?name=${name}`,
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

const images = {};

for (let i = 0; i < fileList.length; i++) {
  const fileName = fileList[i];
  const matches = fileName.match(/^([0-9x]+)_(\w+)\.\w+$/i);
  if (matches) {
    if (!images[matches[1]]) {
      images[matches[1]] = [];
    }
    images[matches[1]].push(fileName);
  }
}

const result = [];

Object.keys(images).forEach((code) => {
  const arr = images[code];
  if (arr.length > 1) {
    const cc = arr
      .map((name) => {
        const stats = fs.statSync(path.join(dirname, name));
        return {
          name,
          dateTimeCreate: stats.ctimeMs,
        };
      })
      .sort((a, b) => {
        if (a.dateTimeCreate === b.dateTimeCreate) {
          return 0;
        }
        if (a.dateTimeCreate > b.dateTimeCreate) {
          return -1;
        }
        return 1;
      });
    result.push(cc[0].name);
  } else {
    result.push(arr[0]);
  }
});

const action = async (name) => {
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
};

for (let i = 0; i < result.length; i++) {
  const fileName = result[i];
  sem.acquire(() => {
    action(fileName)
      .then(() => {
        sem.release();
      });
  });
}
