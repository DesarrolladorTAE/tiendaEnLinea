import { createContext, useContext } from "react";

export const POSOperationsContext = createContext(null);
export const usePOSOperations = () => useContext(POSOperationsContext);
