import { useState, useEffect } from 'react';

export const useAILoader = (messages: string[], onComplete?: () => void, intervalTime: number = 750) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Plain derived value. This used to be state written by an effect that ran on
  // every currentIdx change, which cost an extra render per revealed message.
  const displayedMessages = messages.slice(0, currentIdx + 1);

  useEffect(() => {
    if (messages.length === 0) return;

    // Progress bar fill timing (roughly aligned with messages total time)
    const duration = messages.length * intervalTime;
    const progressInterval = 50;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (duration / progressInterval));
        if (next >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return next;
      });
    }, progressInterval);

    // Messages reveal timing
    const messageTimer = setInterval(() => {
      setCurrentIdx((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= messages.length) {
          clearInterval(messageTimer);
          setTimeout(() => {
            setIsFinished(true);
            if (onComplete) onComplete();
          }, 400);
          return messages.length;
        }
        return nextIdx;
      });
    }, intervalTime);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
    };
  }, [messages, onComplete, intervalTime]);

  return {
    displayedMessages,
    currentIdx,
    progress,
    isFinished,
  };
};
