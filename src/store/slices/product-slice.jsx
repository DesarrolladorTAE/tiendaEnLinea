import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Acción para cargar los productos desde la API
export const fetchProducts = createAsyncThunk(
    "product/fetchProducts",
    async (storeName, { rejectWithValue }) => {
      try {
        console.log("Obteniendo productos para la tienda:", storeName);
        const response = await fetch(
          `https://mitiendaenlineamx.com.mx/api/products`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Store-Name": storeName,
            },
          }
        );
  
        console.log("Response status:", response.status);
  
        if (!response.ok) {
          throw new Error(`Error al cargar los productos. Código: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Productos obtenidos desde la API:", data);
        return data;
      } catch (error) {
        console.error("Error en fetchProducts:", error);
        return rejectWithValue(error.message);
      }
    }
  );
  
  
  // ✅ Acción para obtener un solo producto por ID
  export const fetchProductById = createAsyncThunk(
    "product/fetchProductById",
    async ({ storeName, productId }, { rejectWithValue }) => {
      try {
        console.log("Obteniendo producto ID:", productId, "para tienda:", storeName);
        const response = await fetch(
          `https://mitiendaenlineamx.com.mx/api/products/${productId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Store-Name": storeName,
            },
          }
        );
  
        if (!response.ok) {
          throw new Error("Error al cargar el producto");
        }
  
        const data = await response.json();
        console.log("Producto obtenido:", data);
        return data;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );
  
  const productSlice = createSlice({
    name: "product",
    initialState: {
      products: [],
      product: null,
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
        })
        .addCase(fetchProductById.pending, (state) => {
          state.loading = true;
          state.error = null;
          state.product = null;
        })
        .addCase(fetchProductById.fulfilled, (state, action) => {
          state.loading = false;
          state.product = action.payload;
        })
        .addCase(fetchProductById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    },
  });
  
  export default productSlice.reducer;