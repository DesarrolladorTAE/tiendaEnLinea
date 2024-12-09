import { createSlice } from '@reduxjs/toolkit';  // Importa 'createSlice' correctamente

const productSlice = createSlice({
    name: 'product',
    initialState: {
        products: [],
    },
    reducers: {
        setProducts(state, action) {
            state.products = action.payload;
        }
    },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;
