// src/store/slices/whatsappCartSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: []
};

const whatsappCartSlice = createSlice({
  name: "whatsappCart",
  initialState,
  reducers: {
    addToWhatsappCart: (state, action) => {
      const exists = state.items.find(item => item.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeFromWhatsappCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload.id);
    },
    clearWhatsappCart: (state) => {
      state.items = [];
    }
  }
});

export const {
  addToWhatsappCart,
  removeFromWhatsappCart,
  clearWhatsappCart
} = whatsappCartSlice.actions;

export default whatsappCartSlice.reducer;
