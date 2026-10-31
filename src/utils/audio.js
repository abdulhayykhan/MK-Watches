// Audio synthesizer disabled per user request
class SilentAudioManager {
  constructor() {
    this.isMuted = true;
  }
  init() {}
  toggle() { return false; }
  playMechanicalTick() {}
  playRatchetClick() {}
  playChime() {}
  startTicking() {}
  stopTicking() {}
  startAmbient() {}
  stopAmbient() {}
}

export const audioManager = new SilentAudioManager();
