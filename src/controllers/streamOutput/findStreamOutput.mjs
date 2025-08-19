import { find } from '@quanxiaoxiao/list';

import { getState } from '#store.mjs';

export default (streamOutput) => {
  const { streamOutputList } = getState();
  return find(streamOutputList)(streamOutput);
};
