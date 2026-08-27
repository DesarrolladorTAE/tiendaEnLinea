// src/store/slices/whatsappCartSlice.jsx
import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  items: [] // { cart_key, product_id, variant_id, warehouse_id, name, display_name, price, qty, meta }
};

const refreshQuantityPrices = (items, productId) => {
  const related = items.filter((item) => Number(item.product_id) === Number(productId));
  const totalQty = related.reduce((total, item) => total + (Number(item.qty) || 0), 0);
  related.forEach((item) => {
    const minimum = Number(item.meta?.wholesale_min_quantity) || 0;
    const wholesalePrice = Number(item.meta?.wholesale_unit_price) || 0;
    const regularPrice = Number(item.meta?.regular_price);
    const applies = minimum >= 2 && wholesalePrice > 0 && totalQty >= minimum;
    if (applies) item.price = wholesalePrice;
    else if (Number.isFinite(regularPrice)) item.price = regularPrice;
    item.meta = { ...(item.meta || {}), wholesale_price: applies, group_total_requested: totalQty };
  });
};

const whatsappCartSlice = createSlice({
  name: "whatsappCart",
  initialState,
  reducers: {
    addToWhatsappCart: (state, action) => {
      const {
        cart_key,
        product_id,
        variant_id = null,
        warehouse_id = null,
        warehouse_name = null,
        name,
        display_name,
        price,
        qty = 1,
        meta = {}
      } = action.payload || {};

      if (!cart_key) return;

      const idx = state.items.findIndex((it) => it.cart_key === cart_key);

      if (idx >= 0) {
        state.items[idx].qty += Number(qty) || 1;
        state.items[idx].meta = { ...state.items[idx].meta, ...(meta || {}) };
      } else {
        state.items.push({
          cart_key,
          product_id: Number(product_id),
          variant_id: variant_id != null ? Number(variant_id) : null,
          warehouse_id: warehouse_id != null ? Number(warehouse_id) : null,
          warehouse_name: warehouse_name ?? null,

          name: String(name ?? "Producto"),
          display_name: String(display_name ?? name ?? "Producto"),
          price: Number(price ?? 0),
          qty: Number(qty) || 1,

          meta: meta || {}
        });
      }
      refreshQuantityPrices(state.items, product_id);
    },

    incrementItemQty: (state, action) => {
      const { cart_key, step = 1 } = action.payload || {};
      const idx = state.items.findIndex((it) => it.cart_key === cart_key);
      if (idx >= 0) {
        state.items[idx].qty += Number(step) || 1;
        refreshQuantityPrices(state.items, state.items[idx].product_id);
      }
    },

    decrementItemQty: (state, action) => {
      const { cart_key, step = 1 } = action.payload || {};
      const idx = state.items.findIndex((it) => it.cart_key === cart_key);
      if (idx >= 0) {
        const productId = state.items[idx].product_id;
        state.items[idx].qty -= Number(step) || 1;
        if (state.items[idx].qty <= 0) state.items.splice(idx, 1);
        refreshQuantityPrices(state.items, productId);
      }
    },

    setItemQty: (state, action) => {
      const { cart_key, qty } = action.payload || {};
      const idx = state.items.findIndex((it) => it.cart_key === cart_key);
      if (idx >= 0) {
        const productId = state.items[idx].product_id;
        const q = Number(qty) || 0;
        if (q <= 0) state.items.splice(idx, 1);
        else state.items[idx].qty = q;
        refreshQuantityPrices(state.items, productId);
      }
    },

    removeFromWhatsappCart: (state, action) => {
      const key = action.payload?.cart_key ?? action.payload;
      const productId = state.items.find((item) => item.cart_key === key)?.product_id;
      state.items = state.items.filter((item) => item.cart_key !== key);
      if (productId != null) refreshQuantityPrices(state.items, productId);
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

// Selectores
export const selectWhatsappCartItems = (state) => state.whatsappCart.items;

export const selectWhatsappCartCount = createSelector(
  selectWhatsappCartItems,
  (items) => items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)
);

export const selectWhatsappCartTotal = createSelector(
  selectWhatsappCartItems,
  (items) => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0)
);
