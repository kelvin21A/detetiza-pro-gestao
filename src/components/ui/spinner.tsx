import { Loader2 } from 'lucide-react';

const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
};

export default Spinner;
