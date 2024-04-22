import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import fileSize from 'file-size';

const getObjKeys = (obj) => Object
  .keys(obj)
  .sort((a, b) => {
    if (a === b) {
      return 0;
    }
    if (a > b) {
      return 1;
    }
    return -1;
  });

const format = (obj) => {
  if (obj == null) {
    return null;
  }
  const type = typeof obj;
  if (type === 'function') {
    if (obj.toJSON) {
      return obj.toJSON();
    }
    return '() => {...}';
  }
  if (type === 'object') {
    if (obj instanceof Map) {
      const objMap = Object.fromEntries(obj);
      return getObjKeys(obj)
        .reduce((acc, cur) => ({
          ...acc,
          [cur]: format(objMap[cur]),
        }), {});
    }
    if (obj instanceof Set) {
      return Array.from(obj);
    }
    if (obj instanceof RegExp) {
      return obj.toString();
    }
    if (Buffer.isBuffer(obj)) {
      if (obj.length <= 64) {
        return `<Buffer ${obj.toString('hex')} />`;
      }
      return `<Buffer ${fileSize(obj.length).human()}, ${crypto.createHash('sha256').update(obj).digest('hex')} sha256 />`;
    }
    if (Array.isArray(obj)) {
      return obj.map((d) => format(d));
    }
    return getObjKeys(obj).reduce((acc, key) => ({
      ...acc,
      [key]: format(obj[key]),
    }), {});
  }
  return obj;
};

export default format;
