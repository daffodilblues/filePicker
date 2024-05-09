// store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../reducers/auth_slice';
// import orgDataReducer from "../reducers/organization_slice";
// import userReducer from "../reducers/user_slice";
// import userSubscriptionReducer from "../reducers/payments/user_subscription_slice";

export const store = configureStore({
  reducer: {
    authReducer: authReducer
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;