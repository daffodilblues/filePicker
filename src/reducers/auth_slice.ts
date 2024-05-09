// authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for the slice state
interface AuthState {
  loggedIn: boolean;
  userInfo: any;
}

// Initial state
const initialState: AuthState = {
  loggedIn: false,
  userInfo: null
};

// Slice
const authSlice = createSlice({
  name: 'authReducer',
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    changeLoginState: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload;
    }
  },
});

// Export the action creators
export const { changeLoginState } = authSlice.actions;

// Export the reducer, to be used in the store
export default authSlice.reducer;
