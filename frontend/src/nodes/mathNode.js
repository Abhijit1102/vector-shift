// mathNode.js  — evaluates a numeric expression with named input slots

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const MathNode = ({ id, data }) => {
    const { values, handleChange } = useNodeFields(
        { expression: 'a + b', precision: '2' },
        data
    );

    return (
        <BaseNode
            id={id}
            title="Math"
            variant="math"
            icon="∑"
            handles={[
                { id: 'a', type: 'target' },
                { id: 'b', type: 'target' },
                { id: 'result', type: 'source' },
            ]}
            fields={[
                { key: 'expression', label: 'Expression', type: 'text', placeholder: 'a * b / 100' },
                {
                    key: 'precision', label: 'Decimal Places', type: 'select',
                    options: ['0', '1', '2', '3', '4', '6'],
                },
            ]}
            fieldValues={values}
            onFieldChange={handleChange}
        />
    );
};
