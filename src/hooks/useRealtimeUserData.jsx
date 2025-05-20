import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "../axiosConfig";
import {
  updateSaldo,
  updateGanancias,
  setNotificaciones
} from "../store/slices/userSlice";

const useRealtimeUserData = (interval = 5000) => {
  const dispatch = useDispatch();

  useEffect(() => {
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

      } catch (err) {
        console.warn("Error actualizando datos en tiempo real:", err);
      }
    }, interval);

    return () => clearInterval(intervalo);
  }, [ interval]);
};

export default useRealtimeUserData;
