import { remove } from '@quanxiaoxiao/list';
import { ResourceRecord as ResourceRecordModel } from '../../models/index.mjs';
import store from '../../store/store.mjs';

const { dispatch, getState } = store;

export default (streamOutput) => {
  const { streamOutputList } = getState();
  const ret = remove(streamOutputList)(streamOutput);
  if (!ret) {
    return null;
  }
  const [streamOutputItem] = ret;
  if (streamOutputItem.resourceRecord) {
    ResourceRecordModel.updateOne(
      {
        _id: streamOutputItem.resourceRecord,
      },
      {
        $set: {
          dateTimeAccess: streamOutputItem.dateTimeCreate,
        },
        $inc: {
          countRead: 1,
        },
      },
    )
      .then(
        () => {},
        (error) => {
          console.error(error);
        },
      );
  }
  dispatch('streamOutputList', ret[1]);
  return streamOutputItem;
};
