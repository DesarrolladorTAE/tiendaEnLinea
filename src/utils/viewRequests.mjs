let pending = 0;
const listeners = new Set();
export const getPendingViewRequests = () => pending;
export function subscribeViewRequests(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function beginViewRequest() {
  pending++; listeners.forEach(listener => listener());
  let done = false;
  return () => { if (done) return; done=true; pending=Math.max(0,pending-1); listeners.forEach(listener => listener()); };
}
