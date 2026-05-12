import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './reduxStore';

/** Typed dispatch hook */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector hook */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
