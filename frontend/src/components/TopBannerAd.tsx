import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';

const TOP_BANNER_AD_GROUP_ID =
  import.meta.env.VITE_TOP_BANNER_AD_GROUP_ID ?? 'ait.v2.live.d1e377470a12438b';

export default function TopBannerAd() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Step 1: SDK 초기화 (attachBanner 전에 반드시 필요)
  useEffect(() => {
    if (!TossAds.initialize.isSupported()) return;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (error) => {
          console.error('TossAds init failed:', error);
        },
      },
    });
  }, []);

  // Step 2: 초기화 완료 후 배너 부착
  useEffect(() => {
    if (!isInitialized) return;
    if (!TossAds.attachBanner.isSupported()) return;

    const element = containerRef.current;
    if (!element) return;

    const banner = TossAds.attachBanner(TOP_BANNER_AD_GROUP_ID, element, {
      theme: 'auto',
      variant: 'expanded',
      callbacks: {
        onAdFailedToRender: (payload) => {
          console.error('Top banner render failed:', payload.error);
        },
        onNoFill: () => {
          console.warn('Top banner returned no fill');
        },
      },
    });

    return () => {
      banner.destroy();
    };
  }, [isInitialized]);

  if (!TossAds.initialize.isSupported()) return null;

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 96 }}
      />
    </div>
  );
}
