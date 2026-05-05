import { db } from '@/persist/db';
import type { Lang } from '@/engine/state/types';
import { gameStore } from '@/store/gameStore';

export async function initLanguage(): Promise<void> {
  await db.init();
  const stored = await db.getSetting('lang');
  if (stored === 'en' || stored === 'ja') {
    gameStore.setState({ lang: stored });
    return;
  }
  const browserLang: Lang = (navigator.language ?? '').startsWith('ja') ? 'ja' : 'en';
  gameStore.setState({ lang: browserLang });
  await db.setSetting('lang', browserLang);
}
