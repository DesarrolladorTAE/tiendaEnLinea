import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';  

// Acción para cargar los productos desde la API
export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async (tienda_id, { rejectWithValue }) => {
        try {
            const response = await fetch(`https://mitiendaenlineamx.com.mx/api/products`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Error al cargar los productos');
            }

            const data = await response.json();
            console.log("Productos obtenidos:", data);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const productSlice = createSlice({
    name: 'product',
    initialState: {
        products: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default productSlice.reducer;
