import { SET_ALERT, REMOVE_ALERT } from './types';
import uuid from 'uuid/v4';

export const setAlert = (msg, alertType) => dispatch => {
  const id = uuid;
  dispatch({
    type: SET_ALERT,
    payload: { msg, alertType, id }
  });
};
