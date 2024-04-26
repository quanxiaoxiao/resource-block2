import assert from 'node:assert';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';
import { httpRequest } from '@quanxiaoxiao/http-request';

const decode = (responseItem) => {
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

export const fetchEntries = async () => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: '/api/entries',
  });
  assert(responseItem.statusCode === 200);
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

export const fetchEntryStatistics = async (entry) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/api/entry/${entry}/statistics`,
  });
  return decode(responseItem);
};

export const fetchEntryResources = async (entry, count) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/api/entry/${entry}/resources?limit=${count}`,
  });
  const { list } = decode(responseItem);
  return list;
};

export const createEntry = async (data) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'POST',
    path: '/api/entry',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return decode(responseItem);
};

export const fetchEntry = async (entry) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/api/entry/${entry}`,
  });
  return decode(responseItem);
};

export const removeEntry = async (entry) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'DELETE',
    path: `/api/entry/${entry}`,
  });
  return decode(responseItem);
};

export const updateEntry = async (entry, data) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
    path: `/api/entry/${entry}`,
  });
  return decode(responseItem);
};

export const fetchResource = async (resource) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/api/resource/${resource}`,
  });
  return decode(responseItem);
};

export const removeResource = async (resource) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'DELETE',
    path: `/api/resource/${resource}`,
  });
  return decode(responseItem);
};

export const updateResource = async (resource, data) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
    path: `/api/resource/${resource}`,
  });
  return decode(responseItem);
};

export const fetchResourceChunk = async (resource) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/resource/${resource}`,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return responseItem.body;
};

export const upload = async ({
  entryName,
  name,
  content,
}) => {
  const options = {
    hostname: '127.0.0.1',
    port: 4059,
    method: 'POST',
    path: '/upload',
    body: content,
  };
  if (entryName) {
    options.path = `/upload/${entryName}`;
  }
  if (name) {
    options.path = `${options.path}?name=${name}`;
  }
  const responseItem = await httpRequest(options);
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};
