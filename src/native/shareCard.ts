import { Capacitor } from '@capacitor/core';

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

interface ShareOpts {
  title: string;
  /** the full text rundown of the career (the end screen, in words) */
  text: string;
}

/** Share a finished career as text via the OS share sheet (WhatsApp, Messages,
 *  etc.). Mirrors the platform split in haptics.ts:
 *   - native: @capacitor/share with the text
 *   - web: Web Share API when available, else copy the text to the clipboard
 *  Every path is best-effort and offline-safe; it never throws into the UI. */
export async function shareCareerText(opts: ShareOpts): Promise<ShareResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: opts.title, text: opts.text, dialogTitle: opts.title });
      return 'shared';
    } catch (e) {
      if (/cancel/i.test(String((e as Error)?.message))) return 'cancelled';
      console.error('Westminster.sim: native share failed', e);
      return 'failed';
    }
  }

  // --- web ---
  if (navigator.share) {
    try {
      await navigator.share({ title: opts.title, text: opts.text });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled';
      // otherwise fall through to clipboard
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(opts.text);
      return 'copied';
    } catch {
      /* fall through to failure */
    }
  }
  return 'failed';
}
