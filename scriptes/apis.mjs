import assert from 'node:assert';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';
import { httpRequest } from '@quanxiaoxiao/http-request';

export const fetchEntries = async () => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: '/api/entries',
  });
  assert(responseItem.statusCode === 200);
  return decodeContentToJSON(responseItem.body, responseItem.headers);
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
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

export const fetchEntry = async (entry) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/api/entry/${entry}`,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

export const removeEntry = async (entry) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    method: 'DELETE',
    path: `/api/entry/${entry}`,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
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
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

export const fetchResource = async (resource) => {
  const responseItem = await httpRequest({
    hostname: '127.0.0.1',
    port: 4059,
    path: `/api/resource/${resource}`,
  });
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};
