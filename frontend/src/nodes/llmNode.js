// llmNode.js  (refactored with BaseNode abstraction)

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const LLMNode = ({ id, data }) => {
  const { values, handleChange } = useNodeFields(
    { model: 'gpt-4o' },
    data
  );

  return (
    <BaseNode
      id={id}
      title="LLM"
      variant="llm"
      icon="🧠"
      handles={[
        { id: 'system', type: 'target' },
        { id: 'prompt', type: 'target' },
        { id: 'response', type: 'source' },
      ]}
      fields={[
        {
          key: 'model', label: 'Model', type: 'select',
          options: ['gpt-4o', 'gpt-4-turbo', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
        },
        { key: 'description', label: 'About', type: 'display', defaultValue: 'Runs a language model.' },
      ]}
      fieldValues={values}
      onFieldChange={handleChange}
    />
  );
};
