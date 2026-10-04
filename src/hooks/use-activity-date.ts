import { useState } from 'react';
import { useIonViewWillEnter } from '@ionic/react';

export const localActivityDate = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const useActivityDate = (): string => {
  const [date, setDate] = useState(localActivityDate);
  useIonViewWillEnter(() => setDate(localActivityDate()));
  return date;
};
