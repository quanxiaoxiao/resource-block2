import assert from 'node:assert';

import request from '@quanxiaoxiao/http-request';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';

const httpRequest = async ({
  path,
  method = 'GET',
  headers = {},
  body = null,
}) => {
  const responseItem = await request(
    {
      path,
      method,
      body,
      headers,
    },
    {
      port: 4059,
    },
  );
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return decodeContentToJSON(responseItem.body, responseItem.headers);
};

export const fetchEntries = async () => {
  const ret = await httpRequest({
    path: '/api/entries',
  });
  return ret;
};

export const fetchEntryStatistics = async (entry) => {
  const ret = await httpRequest({
    path: `/api/entry/${entry}/statistics`,
  });
  return ret;
};

export const fetchEntryResources = async (entry, count) => {
  const ret = await httpRequest({
    path: `/api/entry/${entry}/resources?limit=${count}`,
  });
  assert(!!ret);
  const { list } = ret;
  return list;
};

export const createEntry = async (data) => {
  const ret = await httpRequest({
    method: 'POST',
    path: '/api/entry',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return ret;
};

export const fetchEntry = async (entry) => {
  const ret = await httpRequest({
    path: `/api/entry/${entry}`,
  });
  return ret;
};

export const removeEntry = async (entry) => {
  const ret = await httpRequest({
    method: 'DELETE',
    path: `/api/entry/${entry}`,
  });
  return ret;
};

export const updateEntry = async (entry, data) => {
  const ret = await httpRequest({
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
    path: `/api/entry/${entry}`,
  });
  return ret;
};

export const fetchResource = async (resource) => {
  const ret = await httpRequest({
    path: `/api/resource/${resource}`,
  });
  return ret;
};

export const removeResource = async (resource) => {
  const ret = await httpRequest({
    method: 'DELETE',
    path: `/api/resource/${resource}`,
  });
  return ret;
};

export const updateResource = async (resource, data) => {
  const ret = await httpRequest({
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
    path: `/api/resource/${resource}`,
  });
  return ret;
};

export const fetchResourceChunk = async (resource, range) => {
  const options = {
    path: `/resource/${resource}`,
    headers: {},
  };
  if (range) {
    options.headers.range = `bytes=${range[0]}-${range[1] == null ? '' : range[1]}`;
  }
  const responseItem = await request(
    options,
    {
      port: 4059,
    },
  );
  if (range) {
    assert(responseItem.statusCode !== 200);
    if (responseItem.statusCode === 404) {
      return null;
    }
    return responseItem.body;
  }
  if (responseItem.statusCode !== 200) {
    return null;
  }
  return responseItem.body;
};

export const upload = async ({
  entry,
  name,
  content,
}) => {
  const options = {
    method: 'POST',
    path: '/upload',
    body: content,
  };
  if (entry) {
    options.path = `/upload/${entry}`;
  }
  if (name) {
    options.path = `${options.path}?name=${name}`;
  }
  const ret = await httpRequest(options);
  return ret;
};

export const updateResourceBlock = async (resource, content) => {
  const ret = await httpRequest({
    method: 'PUT',
    path: `/resource/${resource}`,
    body: content,
  });
  return ret;
};

export const fetchResourceRecords = async (resource) => {
  const ret = await httpRequest({
    path: `/api/resource/${resource}/records`,
  });
  return ret;
};
