import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("store_token") || "");

  useEffect(() => {
    // const savedStore = JSON.parse(localStorage.getItem("store_data"));
    if (savedStore) {
      setStore(savedStore);
    }
  }, []);

  const login = (token, store) => {
    // localStorage.setItem("store_token", token);
    // localStorage.setItem("store_data", JSON.stringify(store)); 
    setToken(token);
    setStore(store);
  };

  const logout = () => {
    localStorage.removeItem("store_token");
    localStorage.removeItem("store_data");
    setToken("");
    setStore(null);
  };

  return (
    <AuthContext.Provider value={{ token, store, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
