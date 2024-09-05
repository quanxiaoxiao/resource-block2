import mongoose from 'mongoose';
import path from 'node:path';
import assert from 'node:assert';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
import { sort } from '@quanxiaoxiao/list';
import {
  STREAM_TYPE_RESOURCE_CREATE,
  STREAM_TYPE_RESOURCE_UPDATE,
} from '../../constants.mjs';
import store from '../../store/store.mjs';

const { dispatch, getState } = store;

export default ({
  entry,
  name = '',
  request,
  resource,
  remoteAddress,
  type = STREAM_TYPE_RESOURCE_CREATE,
}) => {
  assert(typeof entry === 'string');
  assert([
    STREAM_TYPE_RESOURCE_CREATE,
    STREAM_TYPE_RESOURCE_UPDATE,
  ].includes(type));
  const _id = new mongoose.Types.ObjectId().toString();
  const model = {
    _id,
    type,
    resource,
    chunkSize: 0,
    name,
    request: {
      path: request.path,
      headers: request.headers || {},
    },
    sha256: null,
    dateTimeActive: null,
    dateTimeStore: null,
    dateTimeCreate: Date.now(),
    remoteAddress,
    pathname: path.resolve(getState().block.tempDir, _id),
    entry,
  };
  if (model.type === STREAM_TYPE_RESOURCE_CREATE) {
    assert(model.resource == null);
    model.resource = new mongoose.Types.ObjectId().toString();
  } else {
    assert(typeof model.resource === 'string');
    assert(isValidObjectId(model.resource));
  }
  dispatch('streamInputList', (pre) => sort([...pre, model]));
  return model;
};
