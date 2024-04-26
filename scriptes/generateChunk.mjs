import crypto from 'node:crypto';

export default (size = 24) => crypto.randomBytes(size);
