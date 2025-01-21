"use client";

import { createContext, useContext } from "react";
import { useDisclosure } from "@heroui/modal";

const ModalContext = createContext({
  isOpen: false,
  onOpen: () => {},
  onClose: () => {},
  onToggle: () => {},
});

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const disclosure = useDisclosure();
  return (
    <ModalContext.Provider value={{ ...disclosure, onToggle: () => {} }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
