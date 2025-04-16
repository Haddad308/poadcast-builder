import { useEffect, useState } from "react";

const useElapsedTime = (isActive: boolean) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Track elapsed time during conversion
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      if (!startTime) {
        setStartTime(Date.now());
      }

      interval = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else {
      setStartTime(null);
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, isActive]);

  return { elapsedTime };
};

export default useElapsedTime;
