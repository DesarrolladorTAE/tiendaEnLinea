import cogoToast from 'cogo-toast';
import { createSlice } from '@reduxjs/toolkit'; // Corregido aquí

const compareSlice = createSlice({
    name: 'compare',
    initialState: {
        compareItems: []
    },
    reducers: {
        addToCompare(state, action) {
            // Verifica si el ítem ya está en la lista para evitar duplicados
            const existingItem = state.compareItems.find(item => item.id === action.payload.id);
            if (!existingItem) {
                state.compareItems.push(action.payload);
                cogoToast.success("Added To Compare", { position: "bottom-left" });
            } else {
                cogoToast.info("Item Already in Compare", { position: "bottom-left" });
            }
        },
        deleteFromCompare(state, action) {
            const initialLength = state.compareItems.length;
            state.compareItems = state.compareItems.filter(item => item.id !== action.payload);

            // Solo muestra el mensaje si realmente se ha eliminado un ítem
            if (state.compareItems.length < initialLength) {
                cogoToast.error("Removed From Compare", { position: "bottom-left" });
            } else {
                cogoToast.info("Item Not Found in Compare", { position: "bottom-left" });
            }
        }
    },
});

export const { addToCompare, deleteFromCompare } = compareSlice.actions;
export default compareSlice.reducer;
