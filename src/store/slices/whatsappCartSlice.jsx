// src/store/slices/whatsappCartSlice.js
import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  items: [] // cada item: { id, name, price, qty }
};

const whatsappCartSlice = createSlice({
  name: "whatsappCart",
  initialState,
  reducers: {
    // Agrega al carrito; si ya existe el id, suma qty
    addToWhatsappCart: (state, action) => {
      const { id, name, price, qty = 1 } = action.payload || {};
      if (!id) return;

      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        state.items[idx].qty += qty;
      } else {
        state.items.push({
          id,
          name: String(name ?? "Producto"),
          price: Number(price ?? 0),
          qty: Number(qty) || 1
        });
      }
    },

    // Suma unidades (por defecto +1)
    incrementItemQty: (state, action) => {
      const { id, step = 1 } = action.payload || {};
      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) state.items[idx].qty += Number(step) || 1;
    },

    // Resta unidades (por defecto -1). Si queda <= 0, elimina el producto.
    decrementItemQty: (state, action) => {
      const { id, step = 1 } = action.payload || {};
      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        state.items[idx].qty -= Number(step) || 1;
        if (state.items[idx].qty <= 0) state.items.splice(idx, 1);
      }
    },

    // Fija una cantidad exacta; si qty <= 0, elimina el producto.
    setItemQty: (state, action) => {
      const { id, qty } = action.payload || {};
      const idx = state.items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        const q = Number(qty) || 0;
        if (q <= 0) state.items.splice(idx, 1);
        else state.items[idx].qty = q;
      }
    },

    // Elimina un producto completo por id (compatible con {id} o id directo)
    removeFromWhatsappCart: (state, action) => {
      const id = action.payload?.id ?? action.payload;
      state.items = state.items.filter((item) => item.id !== id);
    },

    // Vaciar todo
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

/* Selectores útiles */
export const selectWhatsappCartItems = (state) => state.whatsappCart.items;

export const selectWhatsappCartCount = createSelector(
  selectWhatsappCartItems,
  (items) => items.reduce((acc, it) => acc + (it.qty || 0), 0)
);

export const selectWhatsappCartTotal = createSelector(
  selectWhatsappCartItems,
  (items) =>
    items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
      0
    )
);
