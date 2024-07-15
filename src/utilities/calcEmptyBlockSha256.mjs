import crypto from 'node:crypto';

export default () => {
  const hash = crypto.createHash('sha256');
  return hash.update(Buffer.from([])).digest('hex');
};
