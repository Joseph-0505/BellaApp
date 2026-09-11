import React, { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from "react";
import { useFocusEffect } from "expo-router";

type Action = { label: string; onPress: () => void };
const Context = createContext<{ action: Action | null; setAction: (action: Action | null) => void }>({ action: null, setAction: () => {} });

export function PageActionProvider({ children }: PropsWithChildren) {
  const [action, setAction] = useState<Action | null>(null);
  return <Context.Provider value={{ action, setAction }}>{children}</Context.Provider>;
}

export const usePageAction = () => useContext(Context);

export function PageAction({ label, onPress }: Action) {
  const { setAction } = usePageAction();
  const callback = useRef(onPress);
  callback.current = onPress;
  useFocusEffect(useCallback(() => {
    setAction({ label, onPress: () => callback.current() });
    return () => setAction(null);
  }, [label, setAction]));
  return null;
}
