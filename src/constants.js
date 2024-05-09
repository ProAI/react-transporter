// eslint-disable-next-line import/no-unresolved
import { Platform } from 'react-native';

export const isServer = typeof window === 'undefined';
export const isWeb = !Platform || Platform.OS === 'web';

export const PENDING = 'pending';
export const FULFILLED = 'fulfilled';
export const REJECTED = 'rejected';

export const TYPENAME = '__typename';
export const ID = 'id';

export const REF_KEY = '__ref';
