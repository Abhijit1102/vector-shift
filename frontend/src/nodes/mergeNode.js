// mergeNode.js  — combines multiple incoming values into one object/array

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const MergeNode = ({ id, data }) => {
    const { values, handleChange } = useNodeFields(
        { strategy: 'Object (key→value)', keys: 'a, b, c' },
        data
    );

    return (
        <BaseNode
            id={id}
            title="Merge"
            variant="merge"
            icon="⊕"
            handles={[
                { id: 'in-a', type: 'target' },
                { id: 'in-b', type: 'target' },
                { id: 'in-c', type: 'target' },
                { id: 'out', type: 'source' },
            ]}
            fields={[
                {
                    key: 'strategy', label: 'Strategy', type: 'select',
                    options: [
                        'Object (key→value)',
                        'Array (ordered)',
                        'Concatenate Strings',
                        'Deep Merge Objects',
                    ],
                },
                { key: 'keys', label: 'Input Labels (comma-sep)', type: 'text', placeholder: 'a, b, c' },
            ]}
            fieldValues={values}
            onFieldChange={handleChange}
        />
    );
};
