/**
 * Read-only realtime subscriptions.
 *
 * This is the only place the browser reads Appwrite directly, and it reads
 * nothing it was not explicitly granted: every collection is provisioned with no
 * client write permission, and the collections subscribed to here carry document
 * security, so a socket only ever receives documents the server granted this
 * user read on. Everything else — every query, every write — goes through
 * FastAPI.
 *
 * A payload arriving here is a notification, not a source of truth. Handlers
 * should either patch the cache with the row Appwrite sent or ask react-query to
 * refetch; they must never compute derived values (unread counts, ordering,
 * counters) from a socket event, because the server owns those.
 */
import { client, DATABASE_ID } from './appwrite';

export type RealtimeEvent = 'create' | 'update' | 'delete';

export interface RealtimeMessage<T> {
  event: RealtimeEvent;
  document: T;
}

function eventKind(events: string[]): RealtimeEvent | null {
  if (events.some(e => e.endsWith('.create'))) return 'create';
  if (events.some(e => e.endsWith('.update'))) return 'update';
  if (events.some(e => e.endsWith('.delete'))) return 'delete';
  return null;
}

/**
 * Subscribe to a collection's documents. Returns the unsubscribe function, which
 * callers must invoke on unmount — an abandoned subscription keeps a socket open
 * and keeps firing handlers against an unmounted component.
 *
 * The subscription is silently empty rather than an error when the user has no
 * read grant on anything in the collection, so a caller cannot tell "nothing
 * happened" from "not permitted"; the API remains the way to know.
 */
export function subscribeToCollection<T>(
  collectionId: string,
  handler: (message: RealtimeMessage<T>) => void,
): () => void {
  const channel = `databases.${DATABASE_ID}.collections.${collectionId}.documents`;

  try {
    return client.subscribe(channel, (response: { events: string[]; payload: unknown }) => {
      const event = eventKind(response.events ?? []);
      if (!event) return;
      handler({ event, document: response.payload as T });
    });
  } catch {
    // A failed socket must not take a page down with it; the data is already
    // loaded over HTTP and polling continues to refresh it.
    return () => {};
  }
}
