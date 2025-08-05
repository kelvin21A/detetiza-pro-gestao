declare module 'sonner' {
  export interface ToastOptions {
    className?: string;
    description?: string;
    duration?: number;
    icon?: React.ReactNode;
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    style?: React.CSSProperties;
    onDismiss?: (toastId: string) => void;
    onAutoClose?: (toastId: string) => void;
  }

  export interface ToastPromiseOptions<T = any> extends ToastOptions {
    loading?: string | React.ReactNode;
    success?: string | ((data: T) => string | React.ReactNode);
    error?: string | ((error: any) => string | React.ReactNode);
    finally?: () => void | Promise<void>;
  }

  export interface Toast {
    id: string;
    type: 'success' | 'error' | 'loading' | 'default';
    message: string | React.ReactNode;
    options?: ToastOptions;
    createdAt: number;
    visible: boolean;
    height?: number;
  }

  export interface ToasterProps {
    position?: ToastOptions['position'];
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
    children?: (toast: Toast) => React.ReactNode;
  }

  export const toast: {
    (message: string | React.ReactNode, options?: ToastOptions): string;
    success(message: string | React.ReactNode, options?: ToastOptions): string;
    error(message: string | React.ReactNode, options?: ToastOptions): string;
    loading(message: string | React.ReactNode, options?: ToastOptions): string;
    dismiss(toastId?: string): void;
    remove(): void;
    promise<T = any>(
      promise: Promise<T>,
      msgs: ToastPromiseOptions<T>,
      opts?: ToastOptions
    ): Promise<T>;
  };

  export const Toaster: React.FC<ToasterProps>;
  export const useToaster: () => {
    toasts: Toast[];
    pausedAt: number | null;
  };
}
