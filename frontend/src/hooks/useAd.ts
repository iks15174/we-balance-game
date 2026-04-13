import { useCallback, useEffect, useRef, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

interface UseAdOptions {
  adGroupId: string;
  onDismissed?: () => void;
  onReward?: () => void;
}

export function useAd({ adGroupId, onDismissed, onReward }: UseAdOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isSupported = loadFullScreenAd.isSupported();
  const unregisterRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    if (!isSupported) return;
    setIsLoading(true);
    setIsLoaded(false);

    unregisterRef.current?.();
    const unregister = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsLoaded(true);
          setIsLoading(false);
        }
      },
      onError: (err) => {
        console.error('Ad load error:', err);
        setIsLoading(false);
      },
    });
    unregisterRef.current = unregister;
  }, [adGroupId, isSupported]);

  useEffect(() => {
    load();
    return () => { unregisterRef.current?.(); };
  }, [load]);

  const show = useCallback(() => {
    if (!isSupported || !isLoaded) return;
    showFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        switch (event.type) {
          case 'userEarnedReward':
            onReward?.();
            break;
          case 'dismissed':
            setIsLoaded(false);
            onDismissed?.();
            // 다음 광고 미리 로드
            load();
            break;
          case 'failedToShow':
            // 광고 표시 실패 시에도 흐름 유지
            setIsLoaded(false);
            onDismissed?.();
            break;
        }
      },
      onError: (err) => {
        console.error('Ad show error:', err);
        // 광고 실패 시에도 onDismissed 콜백 호출 (UX 흐름 유지)
        setIsLoaded(false);
        onDismissed?.();
      },
    });
  }, [adGroupId, isLoaded, isSupported, load, onDismissed, onReward]);

  return { isLoaded, isLoading, isSupported, show };
}
