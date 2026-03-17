// useNodeFields.js
// Tiny hook that manages field state for any node built with BaseNode.
// Eliminates the repetitive useState + handler boilerplate from every node file.

import { useCallback, useState } from 'react';

/**
 * useNodeFields
 *
 * @param {object} initialValues  – { fieldKey: defaultValue, ... }
 * @param {object} data           – ReactFlow `data` prop (overrides defaults)
 * @returns {{ values, handleChange }}
 *   values       – current state object
 *   handleChange – (key, value) => void  (pass directly to BaseNode's onFieldChange)
 */
export const useNodeFields = (initialValues, data = {}) => {
    // Merge: initialValues → then any matching keys from data
    const seed = Object.fromEntries(
        Object.entries(initialValues).map(([k, v]) => [k, data[k] ?? v])
    );

    const [values, setValues] = useState(seed);

    const handleChange = useCallback((key, value) => {
        setValues(prev => ({ ...prev, [key]: value }));
    }, []);

    return { values, handleChange };
};
