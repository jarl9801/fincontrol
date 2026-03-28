export const logError = (...args) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};
