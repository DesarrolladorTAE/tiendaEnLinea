import { v4 as uuidv4 } from 'uuid';
import cogoToast from 'cogo-toast';
import { createSlice } from '@reduxjs/toolkit'; // Corregido aquí

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        cartItems: []
    },
    reducers: {
        addToCart(state, action) {
            const product = action.payload;
            const existingItemIndex = state.cartItems.findIndex(item =>
                item.id === product.id &&
                item.selectedProductColor === product.selectedProductColor &&
                item.selectedProductSize === product.selectedProductSize &&
                (product.cartItemId ? item.cartItemId === product.cartItemId : true)
            );

            if (existingItemIndex === -1) {
                state.cartItems.push({
                    ...product,
                    quantity: product.quantity ? product.quantity : 1,
                    cartItemId: uuidv4()
                });
            } else {
                const existingItem = state.cartItems[existingItemIndex];
                if (product.selectedProductColor !== existingItem.selectedProductColor ||
                    product.selectedProductSize !== existingItem.selectedProductSize) {
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: uuidv4()
                    });
                } else {
                    state.cartItems[existingItemIndex] = {
                        ...existingItem,
                        quantity: product.quantity ? existingItem.quantity + product.quantity : existingItem.quantity + 1,
                        selectedProductColor: product.selectedProductColor,
                        selectedProductSize: product.selectedProductSize
                    };
                }
            }

            cogoToast.success("Added To Cart", { position: "bottom-left" });
        },
        deleteFromCart(state, action) {
            state.cartItems = state.cartItems.filter(item => item.cartItemId !== action.payload);
            cogoToast.error("Removed From Cart", { position: "bottom-left" });
        },
        decreaseQuantity(state, action) {
            const product = action.payload;
            const existingItemIndex = state.cartItems.findIndex(item => item.cartItemId === product.cartItemId);

            if (existingItemIndex === -1) return;

            const existingItem = state.cartItems[existingItemIndex];

            if (existingItem.quantity === 1) {
                state.cartItems = state.cartItems.filter(item => item.cartItemId !== product.cartItemId);
                cogoToast.error("Removed From Cart", { position: "bottom-left" });
            } else {
                state.cartItems[existingItemIndex] = {
                    ...existingItem,
                    quantity: existingItem.quantity - 1
                };
                cogoToast.warn("Item Decremented From Cart", { position: "bottom-left" });
            }
        },
        deleteAllFromCart(state) {
            state.cartItems = [];
            cogoToast.info("All Items Removed From Cart", { position: "bottom-left" });
        }
    },
});

export const { addToCart, deleteFromCart, decreaseQuantity, deleteAllFromCart } = cartSlice.actions;
export default cartSlice.reducer;
