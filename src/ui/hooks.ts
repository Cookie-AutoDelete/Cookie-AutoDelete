import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '../redux/Store';

export const useUIDispatch = useDispatch.withTypes<Dispatch>();
export const useUISelector = useSelector.withTypes<State>();
