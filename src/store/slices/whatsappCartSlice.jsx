// src/store/slices/whatsappCartSlice.jsx
import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  items: [] // { id, name, price, qty }
};

const whatsappCartSlice = createSlice({
  name: "whatsappCart",
  initialState,
  reducers: {
    addToWhatsappCart: (state, action) => {
      const { id, name, price, qty = 1 } = action.payload || {};
      if (!id) return;

      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        state.items[idx].qty += Number(qty) || 1;
      } else {
        state.items.push({
          id,
          name: String(name ?? "Producto"),
          price: Number(price ?? 0),
          qty: Number(qty) || 1
        });
      }
    },

    incrementItemQty: (state, action) => {
      const { id, step = 1 } = action.payload || {};
      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) state.items[idx].qty += Number(step) || 1;
    },

    decrementItemQty: (state, action) => {
      const { id, step = 1 } = action.payload || {};
      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        state.items[idx].qty -= Number(step) || 1;
        if (state.items[idx].qty <= 0) state.items.splice(idx, 1);
      }
    },

    setItemQty: (state, action) => {
      const { id, qty } = action.payload || {};
      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        const q = Number(qty) || 0;
        if (q <= 0) state.items.splice(idx, 1);
        else state.items[idx].qty = q;
      }
    },

    removeFromWhatsappCart: (state, action) => {
      const id = action.payload?.id ?? action.payload;
      state.items = state.items.filter((item) => item.id !== id);
    },

    clearWhatsappCart: (state) => {
      state.items = [];
    }
  }
});

export const {
  addToWhatsappCart,
  incrementItemQty,
  decrementItemQty,
  setItemQty,
  removeFromWhatsappCart,
  clearWhatsappCart
} = whatsappCartSlice.actions;

export default whatsappCartSlice.reducer;

// Selectores útiles
export const selectWhatsappCartItems = (state) => state.whatsappCart.items;

export const selectWhatsappCartCount = createSelector(
  selectWhatsappCartItems,
  (items) => items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)
);

export const selectWhatsappCartTotal = createSelector(
  selectWhatsappCartItems,
  (items) =>
    items.reduce(
      (sum, it) =>
        sum + (Number(it.price) || 0) * (Number(it.qty ?? 1) || 1),
      0
    )
);
