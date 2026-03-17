// outputNode.js  (refactored with BaseNode abstraction)

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const OutputNode = ({ id, data }) => {
  const { values, handleChange } = useNodeFields(
    {
      outputName: id.replace('customOutput-', 'output_'),
      outputType: 'Text',
    },
    data
  );

  return (
    <BaseNode
      id={id}
      title="Output"
      variant="output"
      icon="⬆"
      handles={[
        { id: 'value', type: 'target' },
      ]}
      fields={[
        { key: 'outputName', label: 'Name', type: 'text', placeholder: 'output_name' },
        {
          key: 'outputType', label: 'Type', type: 'select',
          options: ['Text', 'Image'],
        },
      ]}
      fieldValues={values}
      onFieldChange={handleChange}
    />
  );
};
