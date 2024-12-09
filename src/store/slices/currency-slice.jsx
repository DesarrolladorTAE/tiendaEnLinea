import { createSlice } from '@reduxjs/toolkit'; // Importación correcta para ESModules

const currencySlice = createSlice({
    name: "currency",
    initialState: {
        currencySymbol: "€",
        currencyName: "EUR",
        currencyRate: 1
    },
    reducers: {
        setCurrency(state, action) {
            const currencyName = action.payload;

            // Actualiza el estado de forma inmutable
            switch (currencyName) {
                case "USD":
                    state.currencySymbol = "$";
                    state.currencyRate = 1;
                    state.currencyName = currencyName;
                    break;
                case "EUR":
                    state.currencySymbol = "€";
                    state.currencyRate = 1;
                    state.currencyName = currencyName;
                    break;
                case "GBP":
                    state.currencySymbol = "£";
                    state.currencyRate = 1;
                    state.currencyName = currencyName;
                    break;
                default:
                    // Puedes manejar casos predeterminados o errores si es necesario
                    break;
            }
        }
    },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
