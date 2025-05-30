import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "../axiosConfig";
import {
  updateSaldo,
  updateGanancias,
  setNotificaciones
} from "../store/slices/userSlice";

const useRealtimeUserData = (interval = 5000) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.user);

  const intervalRef = useRef();

  useEffect(() => {
    if (!interval) return; // ⬅️ no activa el polling si el intervalo es null
    // Si no hay sesión, no inicies nada
    if (!token || !isAuthenticated) return;

    intervalRef.current = setInterval(async () => {
      // Vuelve a checar el token/estado en cada tick
      if (!localStorage.getItem("token")) {
        clearInterval(intervalRef.current);
        return;
      }
      try {
        const { data } = await axios.get("/dashboard/mini");

        if (data.saldo !== undefined) {
          dispatch(updateSaldo(data.saldo));
        }
        if (data.ganancias !== undefined) {
          dispatch(updateGanancias(data.ganancias));
        }
        if (data.notificaciones) {
          dispatch(setNotificaciones(data.notificaciones));
        }
      } catch (err) {
        console.warn("Error actualizando datos en tiempo real:", err);
      }
    }, interval);

    // Limpia el intervalo si desmonta, o cambia el token/estado
    return () => clearInterval(intervalRef.current);
  }, [dispatch, interval, token, isAuthenticated]);
};

export default useRealtimeUserData;
