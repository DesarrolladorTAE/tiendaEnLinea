import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { getBooking, getBookings, getDeparture } from "../../services/tours/tourService";
import { bookingCollection, bookingError, bookingRecord } from "../../components/tours/bookingUtils";
import { departureRecord } from "../../components/tours/departureUtils";

export function useBookingScope({ mode = "store", posContext }) {
  const params = useParams(); const navigate = useNavigate(); const { selectedBranch, setHideLayout } = useAdminUi();
  const branchId = Number(mode === "pos" ? posContext?.branchId : params.branchId || selectedBranch?.id);
  const serviceId = Number(mode === "pos" ? posContext?.serviceId : params.serviceId);
  const departureId = Number(mode === "pos" ? posContext?.departureId : params.departureId);
  const posLocationId = mode === "pos" ? posContext?.posLocationId : undefined;
  const context = useMemo(() => ({ mode, branchId, serviceId, departureId, posLocationId }), [mode, branchId, serviceId, departureId, posLocationId]);
  const valid = [branchId, serviceId, departureId].every((id) => Number.isSafeInteger(id) && id > 0);
  const base = `/admin/branches/${branchId}/tours/${serviceId}/departures`;
  useEffect(() => { if (mode === "store") setHideLayout(false); }, [mode, setHideLayout]);
  const sessionExpired = useCallback(() => { if (mode === "pos") window.location.reload(); else navigate("/login-register", { replace: true }); }, [mode, navigate]);
  return { context, valid, base, navigate, params, sessionExpired };
}
export function useBookingRequest(context, { page = 1, bookingId, sessionExpired }) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", rows: [], lastPage: 1, departure: null, booking: null });
  useEffect(() => {
    let active = true; const controller = new AbortController(); const options = { ...context, signal: controller.signal };
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    Promise.all([getDeparture(options, context.departureId), bookingId ? getBooking(options, bookingId) : getBookings(options, page)]).then(([departure, response]) => {
      if (!active) return;
      setState({ loading: false, error: "", departure: departureRecord(departure.data), ...(bookingId ? { booking: bookingRecord(response.data) } : bookingCollection(response.data)) });
    }).catch((error) => {
      if (!active) return;
      setState({ loading: false, error: bookingError(error), rows: [], lastPage: 1, departure: null, booking: null });
      if (error?.response?.status === 401) sessionExpired();
    });
    return () => { active = false; controller.abort(); };
  }, [context, page, bookingId, revision, sessionExpired]);
  const applyBooking = useCallback((record) => {
    setState((prev) => !record || String(record.id) !== String(prev.booking?.id) ? prev
      : { ...prev, booking: { ...prev.booking, ...record } });
  }, []);
  return { ...state, applyBooking, reload: () => setRevision((value) => value + 1) };
}
