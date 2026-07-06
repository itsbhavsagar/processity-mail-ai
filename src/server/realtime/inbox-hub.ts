export interface InboxEvent {
  type: string;
  [key: string]: unknown;
}

type InboxListener = (event: InboxEvent) => void;

const subscribers = new Map<string, Set<InboxListener>>();

export function subscribe(email: string, listener: InboxListener): () => void {
  let listeners = subscribers.get(email);

  if (!listeners) {
    listeners = new Set();
    subscribers.set(email, listeners);
  }

  listeners.add(listener);

  console.log(
    `[realtime] hub.subscribe email=${email} listenersForEmail=${listeners.size}`,
  ); // TEMP DIAGNOSTIC

  return () => {
    const current = subscribers.get(email);
    if (!current) {
      return;
    }

    current.delete(listener);

    if (current.size === 0) {
      subscribers.delete(email);
    }
  };
}

export function publish(email: string, event: InboxEvent): void {
  const listeners = subscribers.get(email);

  console.log(
    `[realtime] hub.publish email=${email} type=${event.type} subscribers=${listeners?.size ?? 0} knownEmails=${[...subscribers.keys()].join(",")}`,
  ); // TEMP DIAGNOSTIC

  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener(event);
  }
}
