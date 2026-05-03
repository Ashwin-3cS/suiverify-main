'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'suiverify:selfPayGas';
const EVENT_NAME = 'selfpaygas-change';

export const getSelfPayGas = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
};

export const setSelfPayGas = (value: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
};

export const useSelfPayGas = (): [boolean, (v: boolean) => void] => {
  const [value, setValue] = useState<boolean>(false);

  useEffect(() => {
    setValue(getSelfPayGas());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setValue(typeof detail === 'boolean' ? detail : getSelfPayGas());
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return [value, setSelfPayGas];
};
