import { Store } from 'redux';
import { ReduxAction } from '../typings/ReduxConstants';

export default class StoreUser {
  public static init(store: Store) {
    StoreUser.store = store;
  }
  protected static store: Store<State, ReduxAction>;
}
