import React, { Fragment, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from "../../components/withAuth";
import axios from "../../axiosConfig";
import DatePicker from "react-datepicker";
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO, getWeeksInMonth } from "date-fns";
import { FiDownload, FiPrinter } from "react-icons/fi";
import "react-datepicker/dist/react-datepicker.css";
// import "./HistorialRecargas.scss";

const HistorialRecargas = () => {
    const { pathname } = useLocation();
    const [recargas, setRecargas] = useState([]);
    const [filtro, setFiltro] = useState("hoy");
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

    useEffect(() => {
        axios.get("/ver-recargas").then((res) => setRecargas(res.data));
    }, []);

    const hoy = new Date();

    const recargasFiltradas = recargas.filter((r) => {
        const fecha = parseISO(r.created_at);
        switch (filtro) {
            case "hoy":
                return isSameDay(fecha, hoy);
            case "dia":
                return isSameDay(fecha, fechaSeleccionada);
            case "semana":
                const semana = Math.ceil(fecha.getDate() / 7);
                const semanaActual = Math.ceil(hoy.getDate() / 7);
                return isSameMonth(fecha, hoy) && semana === semanaActual;
            case "mes":
                return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
            case "año":
                return fecha.getFullYear() === anioSeleccionado;
            default:
                return true;
        }
    });

    return (
        <Fragment>
           <SEO titleTemplate="Historial de Recargas" />
            <LayoutOne headerTop="visible">
                <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Historial de Recargas", path: pathname }]} />
                <div className="historial-recargas-wrapper">
                    <div className="tabla-recargas-content">
                        <div className="header-bar">
                            <h2>📇 Historial de Recargas</h2>
                            <div className="filtros-laterales">
                                <ul>
                                    <li onClick={() => setFiltro("hoy")}>Hoy</li>
                                    <li onClick={() => setFiltro("dia")}>Día</li>
                                    {filtro === "dia" && (
                                        <li>
                                            <DatePicker
                                                selected={fechaSeleccionada}
                                                onChange={(date) => setFechaSeleccionada(date)}
                                                inline
                                                calendarClassName="calendar-animado"
                                            />
                                        </li>
                                    )}
                                    <li onClick={() => setFiltro("semana")}>Semana</li>
                                    <li onClick={() => setFiltro("mes")}>Mes</li>
                                    {filtro === "mes" && (
                                        <li>
                                            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))}>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i} value={i}>
                                                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                                                    </option>
                                                ))}
                                            </select>
                                        </li>
                                    )}
                                    <li onClick={() => setFiltro("año")}>Año</li>
                                    {filtro === "año" && (
                                        <li>
                                            <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))}>
                                                {[2023, 2024, 2025, 2026].map((a) => (
                                                    <option key={a} value={a}>
                                                        {a}
                                                    </option>
                                                ))}
                                            </select>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <table className="tabla-recargas">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Referencia</th>
                                    <th>Monto</th>
                                    <th>Compañía</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recargasFiltradas.map((r) => (
                                    <tr key={r.id}>
                                        <td>{format(parseISO(r.created_at), "yyyy-MM-dd HH:mm")}</td>
                                        <td>{r.producto?.Codigo || "N/A"}</td>
                                        <td>{r.referencia}</td>
                                        <td>${parseFloat(r.monto).toFixed(2)}</td>
                                        <td>
                                            {r.producto?.carrier?.Logotipo && (
                                                <img
                                                    src={r.producto.carrier.Logotipo}
                                                    alt={r.producto.carrier.Nombre}
                                                    className="logo-carrier"
                                                />
                                            )}
                                            {r.producto?.carrier?.Nombre || "Sin compañía"}
                                        </td>
                                        <td>
                                            {r.producto?.Codigo?.startsWith("TEL") || r.producto?.Codigo?.startsWith("MOV")
                                                ? "Tiempo Aire"
                                                : "Paquete"}
                                        </td>
                                        <td>{r.status}</td>
                                        <td>
                                            <button title="Ticket"><FiPrinter /></button>
                                            <button title="PDF"><FiDownload /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                        {recargasFiltradas.length === 0 && <p style={{ marginTop: "20px" }}>No hay recargas para este filtro.</p>}
                    </div>
                </div>
            </LayoutOne>
        </Fragment>
    );
};

export default withAuth(HistorialRecargas);
