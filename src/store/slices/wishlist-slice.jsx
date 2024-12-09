import cogoToast from 'cogo-toast';
import { createSlice } from '@reduxjs/toolkit'; // Corregido aquí

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        wishlistItems: []
    },
    reducers: {
        addToWishlist(state, action) {
            const isInWishlist = state.wishlistItems.find(item => item.id === action.payload.id);
            if (isInWishlist) {
                cogoToast.info("Product already in wishlist", { position: "bottom-left" });
            } else {
                state.wishlistItems.push(action.payload);
                cogoToast.success("Added To Wishlist", { position: "bottom-left" });
            }
        },
        deleteFromWishlist(state, action) {
            const itemId = action.payload;
            const initialLength = state.wishlistItems.length;
            state.wishlistItems = state.wishlistItems.filter(item => item.id !== itemId);

            // Solo muestra el mensaje si realmente se ha eliminado un ítem
            if (state.wishlistItems.length < initialLength) {
                cogoToast.error("Removed From Wishlist", { position: "bottom-left" });
            } else {
                cogoToast.info("Item Not Found in Wishlist", { position: "bottom-left" });
            }
        },
        deleteAllFromWishlist(state) {
            state.wishlistItems = [];
            cogoToast.info("All Items Removed From Wishlist", { position: "bottom-left" });
        }
    },
});

export const { addToWishlist, deleteFromWishlist, deleteAllFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
