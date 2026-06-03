// DOMException polyfill — Hermes in Expo Go doesn't expose DOMException globally,
// but the web-streams-polyfill (expo/virtual/streams) references it at module load time.
if (typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name ?? 'Error';
      this.code = 0;
    }
  };
}
