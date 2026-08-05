/**
 * The Appwrite browser client.
 *
 * It is used for exactly two things, which is the architecture rule for this
 * codebase:
 *
 *   1. the auth session — `account.*`
 *   2. read-only realtime subscriptions — `client.subscribe`, via lib/realtime.ts
 *
 * `databases` and `storage` are deliberately NOT exported. Every read and write
 * goes through FastAPI, which owns denormalisation, counters, the Pulse/SSR/
 * chemistry maths and every AI call; and no collection grants a client
 * create/update/delete permission, so a direct write would be rejected anyway.
 * Exporting them invited exactly the direct-SDK calls that had to be unwound —
 * profile reads that skipped the endpoint's joins, and a username check that
 * silently failed open. If something needs data, add an endpoint.
 */
import { Client, Account } from 'appwrite';

export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a5fab1d0026ad341f32');

export const account = new Account(client);

/** Needed to build realtime channel names; not for querying. */
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a5faf43003e0b2d9f34';

export default client;
