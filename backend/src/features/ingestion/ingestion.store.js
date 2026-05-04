let lastRun = {
  status: 'never',
  startedAt: null,
  completedAt: null,
  processed: 0,
  results: [],
  error: null,
};

export const getLastRun = () => ({ ...lastRun });

export const setRunning = () => {
  lastRun = {
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    processed: 0,
    results: [],
    error: null,
  };
};

export const setSuccess = (result) => {
  lastRun = {
    status: 'success',
    startedAt: lastRun.startedAt,
    completedAt: new Date().toISOString(),
    processed: result.processed,
    results: result.results,
    error: null,
  };
};

export const setError = (err) => {
  lastRun = {
    status: 'error',
    startedAt: lastRun.startedAt,
    completedAt: new Date().toISOString(),
    processed: 0,
    results: [],
    error: err.message,
  };
};
