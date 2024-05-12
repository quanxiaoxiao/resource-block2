import { updateResource } from './apis.mjs';

const resource = '663f424d7fbec0081cd7560e';

const ret = await updateResource(resource, {
  name: 'cccc.mp4',
  mime: 'video/mp4',
});

console.log(ret);
