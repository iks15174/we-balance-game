import { useEffect, useState } from 'react';

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    setValue(0);

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [duration, target]);

  return value;
}
