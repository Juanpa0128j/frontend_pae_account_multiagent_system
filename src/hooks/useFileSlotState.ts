/**
 * Pure reducer helpers for slot-based state updates.
 * Use inside setSlots(prev => updateSlot(prev, docType, updates)) calls.
 */

export function updateSlot<T extends { docType: string }>(
    slots: T[],
    docType: string,
    updates: Partial<T>
): T[] {
    return slots.map((s) => (s.docType === docType ? { ...s, ...updates } : s));
}

export function updateWhere<T extends { docType: string }>(
    slots: T[],
    predicate: (s: T) => boolean,
    updates: Partial<T>
): T[] {
    return slots.map((s) => (predicate(s) ? { ...s, ...updates } : s));
}
