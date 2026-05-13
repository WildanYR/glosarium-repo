export const isPWAInstalled = () => {
  // 1. Cek mode standalone (Android & Desktop)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // 2. Cek mode standalone khusus iOS Safari
  const isIosStandalone = (window.navigator as any).standalone === true;

  // 3. Cek apakah dibuka di browser dokumen yang dirujuk (khusus beberapa browser Android)
  const isReferrerMobile = document.referrer.includes('android-app://');

  return isStandalone || isIosStandalone || isReferrerMobile;
};