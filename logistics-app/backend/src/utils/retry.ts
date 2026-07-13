const INITIAL_DELAY_SECONDS = 10;
const MAX_DELAY_SECONDS = 600;

export const getNextRetryTime = (retryCount: number): Date => {
  const delay = Math.min(
    INITIAL_DELAY_SECONDS * Math.pow(2, retryCount - 1),
    MAX_DELAY_SECONDS,
  );

  return new Date(Date.now() + delay * 1000);
};
