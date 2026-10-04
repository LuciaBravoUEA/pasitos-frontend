let context: AudioContext | undefined;

export const prepareRewardSound = (): void => {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
  } catch {
    // La recompensa visual sigue disponible aunque el dispositivo no admita audio.
  }
};

export const playRewardSound = (): void => {
  try {
    if (!context || context.state !== 'running') return;
    const audio = context;
    const start = audio.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = start + index * 0.12;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.08, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.23);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(at);
      oscillator.stop(at + 0.25);
    });
  } catch {
    // Un fallo de reproducción nunca cambia el resultado del guardado remoto.
  }
};
