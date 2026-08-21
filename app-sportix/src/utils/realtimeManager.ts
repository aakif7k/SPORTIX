/**
 * src/utils/realtimeManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Appwrite Realtime subscription manager.
 * Handles: notifications, messages, event participant counts.
 * Call subscribeAll() on login, unsubscribeAll() on logout.
 */
import { client, DATABASE_ID, COLLECTIONS } from '../api/appwrite';
import { useNotificationStore } from '../store/notificationStore';
import { AppNotification } from '../types';

type UnsubscribeFn = () => void;

let unsubscribeFns: Array<any> = [];

function makeDocChannel(collection: string): string {
  return `databases.${DATABASE_ID}.collections.${collection}.documents`;
}

/**
 * Subscribe to realtime channels for the given user.
 * @param userId The authenticated user's $id
 * @param onNewMessage Callback when a new message arrives
 * @param onParticipantUpdate Callback when event participants change
 */
export function subscribeAll(opts: {
  userId:                string;
  onNewMessage?:         (payload: any) => void;
  onParticipantUpdate?:  (payload: any) => void;
}): void {
  unsubscribeAll(); // clean slate

  try {
    // ── Notifications ──────────────────────────────────────────────────────────
    const notifUnsub = client.subscribe(
      makeDocChannel(COLLECTIONS.NOTIFICATIONS),
      (response: any) => {
        if (
          response.events.some((e: string) => e.includes('.create')) &&
          response.payload?.user_id === opts.userId
        ) {
          const notif: AppNotification = {
            $id:        response.payload.$id,
            user_id:    response.payload.user_id,
            title:      response.payload.title   ?? '',
            message:    response.payload.message ?? '',
            type:       response.payload.type    ?? 'system',
            is_read:    false,
            created_at: response.payload.$createdAt,
            $createdAt: response.payload.$createdAt,
          };
          useNotificationStore.getState().addNotification(notif);
        }
      },
    );
    unsubscribeFns.push(notifUnsub);

    // ── Messages ───────────────────────────────────────────────────────────────
    if (opts.onNewMessage) {
      const msgUnsub = client.subscribe(
        makeDocChannel(COLLECTIONS.MESSAGES),
        (response: any) => {
          if (response.events.some((e: string) => e.includes('.create'))) {
            opts.onNewMessage!(response.payload);
          }
        },
      );
      unsubscribeFns.push(msgUnsub);
    }

    // ── Event Participant Counts ───────────────────────────────────────────────
    if (opts.onParticipantUpdate) {
      const partUnsub = client.subscribe(
        makeDocChannel(COLLECTIONS.EVENT_PARTICIPANTS),
        (response: any) => {
          const isCreate = response.events.some((e: string) => e.includes('.create'));
          const isDelete = response.events.some((e: string) => e.includes('.delete'));
          if (isCreate || isDelete) {
            opts.onParticipantUpdate!(response.payload);
          }
        },
      );
      unsubscribeFns.push(partUnsub);
    }
  } catch (err) {
    console.warn('[RealtimeManager] subscribeAll error:', err);
  }
}

/** Subscribe to messages in a specific conversation. */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (payload: any) => void,
): () => void {
  try {
    const unsub = client.subscribe(
      makeDocChannel(COLLECTIONS.MESSAGES),
      (response: any) => {
        if (
          response.events.some((e: string) => e.includes('.create')) &&
          response.payload?.conversation_id === conversationId
        ) {
          onMessage(response.payload);
        }
      },
    );
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      } else if (unsub && typeof (unsub as any).then === 'function') {
        (unsub as any).then((fn: any) => typeof fn === 'function' && fn());
      }
    };
  } catch (err) {
    console.warn('[RealtimeManager] subscribeToConversation error:', err);
    return () => {};
  }
}

/** Tear down all active realtime subscriptions. */
export function unsubscribeAll(): void {
  for (const unsub of unsubscribeFns) {
    try {
      if (typeof unsub === 'function') {
        unsub();
      } else if (unsub && typeof (unsub as any).then === 'function') {
        (unsub as any).then((fn: any) => typeof fn === 'function' && fn());
      }
    } catch { /* already closed */ }
  }
  unsubscribeFns = [];
}
