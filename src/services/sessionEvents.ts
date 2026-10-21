// Lets the API layer (plain module, no React) tell the UI that the session
// expired. AuthContext subscribes and shows the "session expired" popup.
type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired() {
  listeners.forEach(l => l());
}
