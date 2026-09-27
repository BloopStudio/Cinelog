import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { Toast } from "@/components/Toast";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setMessage(text);
    setVisible(true);
    hideTimeout.current = setTimeout(() => setVisible(false), 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={message} visible={visible} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé à l'intérieur de ToastProvider");
  }
  return context;
}
