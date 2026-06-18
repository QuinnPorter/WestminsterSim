import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** a light tap on a primary interaction. No-op on web/desktop (so it never
 *  triggers the browser Vibration API); only fires inside the native app. */
export function tap(): void {
  if (!Capacitor.isNativePlatform()) return;
  // fire-and-forget; never let a haptics failure affect gameplay
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
