import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartLine, CartState } from '../types/cart';

const initialState: CartState = { carts: {} };
export const cartId = (tableId: string, sessionId: string) =>
  `${tableId}:${sessionId}`;

const slice = createSlice({
  name: 'waiterCart',
  initialState,
  reducers: {
    addCartLine(
      state,
      {
        payload,
      }: PayloadAction<{ tableId: string; sessionId: string; line: CartLine }>,
    ) {
      const id = cartId(payload.tableId, payload.sessionId);
      const cart = state.carts[id];
      if (
        cart?.requestKey ||
        !Number.isInteger(payload.line.quantity) ||
        payload.line.quantity < 1 ||
        payload.line.quantity > 99
      )
        return;
      state.carts[id] ??= {
        tableId: payload.tableId,
        sessionId: payload.sessionId,
        lines: [],
        status: 'draft',
      };
      state.carts[id].lines.push(payload.line);
    },
    updateCartLine(
      state,
      {
        payload,
      }: PayloadAction<{
        cartId: string;
        lineId: string;
        quantity?: number;
        note?: string;
      }>,
    ) {
      const cart = state.carts[payload.cartId];
      if (!cart || cart.requestKey) return;
      const line = cart.lines.find((l) => l.id === payload.lineId);
      if (!line) return;
      if (
        payload.quantity !== undefined &&
        Number.isInteger(payload.quantity) &&
        payload.quantity >= 1 &&
        payload.quantity <= 99
      ) {
        line.quantity = payload.quantity;
      }
      if (payload.note !== undefined) line.note = payload.note.slice(0, 300);
    },
    removeCartLine(
      state,
      { payload }: PayloadAction<{ cartId: string; lineId: string }>,
    ) {
      const cart = state.carts[payload.cartId];
      if (cart && !cart.requestKey)
        cart.lines = cart.lines.filter((l) => l.id !== payload.lineId);
    },
    clearCart(state, { payload }: PayloadAction<string>) {
      if (!state.carts[payload]?.requestKey) delete state.carts[payload];
    },
    startCartSubmission(
      state,
      { payload }: PayloadAction<{ cartId: string; key: string }>,
    ) {
      const cart = state.carts[payload.cartId];
      if (
        !cart?.lines.length ||
        cart.status === 'sending' ||
        (cart.requestKey && cart.requestKey !== payload.key)
      )
        return;
      cart.requestKey = payload.key;
      cart.status = 'sending';
      cart.error = undefined;
    },
    failCartSubmission(
      state,
      {
        payload,
      }: PayloadAction<{
        cartId: string;
        key: string;
        error: string;
        definitive: boolean;
      }>,
    ) {
      const cart = state.carts[payload.cartId];
      if (!cart || cart.requestKey !== payload.key) return;
      cart.status = payload.definitive ? 'draft' : 'uncertain';
      cart.error = payload.error;
      if (payload.definitive) cart.requestKey = undefined;
    },
    completeCartSubmission(
      state,
      { payload }: PayloadAction<{ cartId: string; key: string }>,
    ) {
      if (state.carts[payload.cartId]?.requestKey === payload.key)
        delete state.carts[payload.cartId];
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) =>
        ['waiter/signOut', 'waiter/authenticated', 'waiter/enterDemo'].includes(
          action.type,
        ),
      () => initialState,
    );
  },
});

export const {
  addCartLine,
  updateCartLine,
  removeCartLine,
  clearCart,
  startCartSubmission,
  failCartSubmission,
  completeCartSubmission,
} = slice.actions;
export default slice.reducer;
