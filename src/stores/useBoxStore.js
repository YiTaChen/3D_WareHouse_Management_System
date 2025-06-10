import { create } from 'zustand'
import { boxStoreImpl } from './boxStore.impl'

export const useBoxStore = create(boxStoreImpl)