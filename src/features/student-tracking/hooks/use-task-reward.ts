import { useEffect, useRef, useState } from 'react';
import { useIonViewDidLeave, useIonViewWillEnter } from '@ionic/react';
import { prepareRewardSound, playRewardSound } from '../../../services/device/reward-sound';
import { useRewardPreferences } from '../../../store/reward-preferences';

export const useTaskReward = () => {
  const [reward, setReward] = useState<{ title: string; sequence: number } | null>(null);
  const visible = useRef(true);
  const hydrate = useRewardPreferences(state => state.hydrate);
  useEffect(() => {
    visible.current = true;
    void hydrate();
    return () => { visible.current = false; };
  }, [hydrate]);
  useIonViewWillEnter(() => { visible.current = true; });
  useIonViewDidLeave(() => { visible.current = false; setReward(null); });
  const prepare = () => {
    setReward(null);
    const preferences = useRewardPreferences.getState();
    if (preferences.loaded && preferences.soundEnabled) prepareRewardSound();
  };
  const celebrate = (title: string) => {
    if (!visible.current) return;
    setReward(previous => ({ title, sequence: (previous?.sequence ?? 0) + 1 }));
    const preferences = useRewardPreferences.getState();
    if (preferences.loaded && preferences.soundEnabled) playRewardSound();
  };
  return { reward, prepare, celebrate, dismiss: () => setReward(null) };
};
