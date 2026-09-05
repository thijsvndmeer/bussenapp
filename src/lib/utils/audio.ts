export type SoundEffect =
  | 'draw'
  | 'success'
  | 'fail'
  | 'playerAdd'
  | 'playerRemove'
  | 'celebrate'
  | 'busEnter'
  | 'busStep'
  | 'busFail'
  | 'reshuffle'
  | 'disco'
  | 'stopDisco';

export const createOscillatorSound = (
  ctx: AudioContext,
  {
    frequency,
    duration = 0.15,
    type = 'sine',
    volume = 0.12,
    attack = 0.01,
    decay = 0.12,
  }: {
    frequency: number;
    duration?: number;
    type?: OscillatorType;
    volume?: number;
    attack?: number;
    decay?: number;
  }
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  const now = ctx.currentTime;
  const start = now + 0.001;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + decay);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + decay + 0.05);
};
