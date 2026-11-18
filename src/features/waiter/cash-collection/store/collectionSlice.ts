import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CollectionDraft, Handover } from '../types';
const initialState: {
    drafts: Record<string, CollectionDraft>;
} = { drafts: {} };
const slice = createSlice({ name: 'waiterCollection', initialState, reducers: {
        startCollection(state, { payload }: PayloadAction<{
            id: string;
            draft: CollectionDraft;
        }>) { state.drafts[payload.id] ??= payload.draft; },
        collectionSaved(state, { payload }: PayloadAction<{
            id: string;
            handover: Handover;
        }>) { if (state.drafts[payload.id])
            state.drafts[payload.id].handover = payload.handover; },
    }, extraReducers: builder => { builder.addMatcher(action => ['waiter/signOut', 'waiter/authenticated', 'waiter/enterDemo'].includes(action.type), () => initialState); } });
export const { startCollection, collectionSaved } = slice.actions;
export default slice.reducer;
