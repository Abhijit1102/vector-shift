// transformNode.js  — applies a named transformation to incoming data

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const TransformNode = ({ id, data }) => {
    const { values, handleChange } = useNodeFields(
        { operation: 'JSON Parse', expression: '' },
        data
    );

    return (
        <BaseNode
            id={id}
            title="Transform"
            variant="transform"
            icon="⚙"
            handles={[
                { id: 'in', type: 'target' },
                { id: 'out', type: 'source' },
            ]}
            fields={[
                {
                    key: 'operation', label: 'Operation', type: 'select',
                    options: [
                        'JSON Parse',
                        'JSON Stringify',
                        'To Uppercase',
                        'To Lowercase',
                        'Trim Whitespace',
                        'Extract Field',
                        'Custom JS',
                    ],
                },
                { key: 'expression', label: 'Expression / Field', type: 'text', placeholder: 'e.g. data.results[0]' },
            ]}
            fieldValues={values}
            onFieldChange={handleChange}
        />
    );
};
