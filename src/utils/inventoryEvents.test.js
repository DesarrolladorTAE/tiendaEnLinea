import { notifyInventoryChanged, subscribeInventoryChanges } from "./inventoryEvents";

test("refreshes from local mutations, other tabs and focus, and cleans up subscriptions", () => {
  const refresh = jest.fn();
  const unsubscribe = subscribeInventoryChanges(refresh);
  notifyInventoryChanged();
  window.dispatchEvent(new StorageEvent("storage", { key: "inventory:updated" }));
  window.dispatchEvent(new Event("focus"));
  expect(refresh).toHaveBeenCalledTimes(3);
  unsubscribe();
  notifyInventoryChanged();
  expect(refresh).toHaveBeenCalledTimes(3);
  localStorage.clear();
});
