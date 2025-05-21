import { useEffect } from "react";
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

  useEffect(() => {
    if (!token || !isAuthenticated) return; // 🔐 Detener si no hay sesión

    const intervalo = setInterval(async () => {
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

        // (Opcional) peticiones paralelas:
        // const notiRes = await axios.get("/mis-notificaciones");
        // dispatch(setNotificaciones(notiRes.data));
      } catch (err) {
        console.warn("Error actualizando datos en tiempo real:", err);
      }
    }, interval);

    return () => clearInterval(intervalo);
  }, [dispatch, interval, token, isAuthenticated]);
};

export default useRealtimeUserData;
