import { getState } from './store.mjs';

export const selectRouteMatchList = () => {
  const state = getState();
  const { routeMatchList } = state;
  return routeMatchList;
};
