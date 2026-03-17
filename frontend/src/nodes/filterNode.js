// filterNode.js  — routes data down true or false branch based on a condition

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const FilterNode = ({ id, data }) => {
    const { values, handleChange } = useNodeFields(
        { condition: '', comparator: 'equals', compareValue: '' },
        data
    );

    return (
        <BaseNode
            id={id}
            title="Filter / Route"
            variant="filter"
            icon="⑂"
            handles={[
                { id: 'in', type: 'target' },
                { id: 'true', type: 'source' },  // passes when condition is met
                { id: 'false', type: 'source' },  // passes when condition is NOT met
            ]}
            fields={[
                { key: 'condition', label: 'Field / Expression', type: 'text', placeholder: 'e.g. data.status' },
                {
                    key: 'comparator', label: 'Comparator', type: 'select',
                    options: ['equals', 'not equals', 'contains', 'greater than', 'less than', 'is empty', 'is not empty'],
                },
                { key: 'compareValue', label: 'Value', type: 'text', placeholder: 'e.g. "success"' },
            ]}
            fieldValues={values}
            onFieldChange={handleChange}
        />
    );
};
