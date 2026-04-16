import { useEffect, useRef } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';

const TOP_BANNER_AD_GROUP_ID =
  import.meta.env.VITE_TOP_BANNER_AD_GROUP_ID ?? 'ait.v2.live.d1e377470a12438b';

export default function TopBannerAd() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!TossAds.attachBanner.isSupported()) {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

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
  }, []);

  if (!TossAds.attachBanner.isSupported()) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#fff',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: 64,
        }}
      />
    </div>
  );
}
