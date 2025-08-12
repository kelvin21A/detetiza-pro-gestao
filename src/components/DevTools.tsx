import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const DevTools = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <ReactQueryDevtools initialIsOpen={false} />;
};

export default DevTools;
