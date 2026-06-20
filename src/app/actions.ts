'use server';

import { kv } from '@vercel/kv';

export async function getUserUnlocks(address: string) {
  if (!address) return { tier2: false, tier3: false };
  const data = await kv.get<{ tier2: boolean; tier3: boolean }>(`tgy_unlocks_${address.toLowerCase()}`);
  return data || { tier2: false, tier3: false };
}

export async function saveUserUnlock(address: string, newUnlocks: { tier2: boolean; tier3: boolean }) {
  if (!address) return;
  await kv.set(`tgy_unlocks_${address.toLowerCase()}`, newUnlocks);
}