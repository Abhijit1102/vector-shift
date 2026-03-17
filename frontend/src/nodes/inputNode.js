// inputNode.js  (refactored with BaseNode abstraction)

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const InputNode = ({ id, data }) => {
  const { values, handleChange } = useNodeFields(
    {
      inputName: id.replace('customInput-', 'input_'),
      inputType: 'Text',
    },
    data
  );

  return (
    <BaseNode
      id={id}
      title="Input"
      variant="input"
      icon="⬇"
      handles={[
        { id: 'value', type: 'source' },
      ]}
      fields={[
        { key: 'inputName', label: 'Name', type: 'text', placeholder: 'input_name' },
        {
          key: 'inputType', label: 'Type', type: 'select',
          options: ['Text', 'File'],
        },
      ]}
      fieldValues={values}
      onFieldChange={handleChange}
    />
  );
};
