import store from './store.mjs';

const { getState } = store;

export const selectRouteMatchList = () => {
  const state = getState();
  const { routeMatchList } = state;
  return routeMatchList;
};
