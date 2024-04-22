import fs from 'node:fs';
import formatDataState from '../../utilities/formatDataState.mjs';

let tick = null;

export default ({ getState }) => (next) => (action) => {
  const output = () => {
    if (tick != null) {
      clearTimeout(tick);
      tick = null;
    }
    tick = setTimeout(() => {
      tick = null;
      fs.writeFileSync(getState().configPathnames.state, JSON.stringify(formatDataState(getState()), null, 2));
    }, 1000);
  };
  output();
  return next(action);
};
