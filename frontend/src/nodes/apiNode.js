// apiNode.js  — calls an external HTTP endpoint

import { BaseNode } from './BaseNode';
import { useNodeFields } from './useNodeFields';

export const ApiNode = ({ id, data }) => {
    const { values, handleChange } = useNodeFields(
        { url: 'https://api.example.com/endpoint', method: 'GET', headers: '' },
        data
    );

    return (
        <BaseNode
            id={id}
            title="API Call"
            variant="api"
            icon="🌐"
            handles={[
                { id: 'body', type: 'target' },   // request body / query
                { id: 'response', type: 'source' },   // raw response text
                { id: 'status', type: 'source' },   // status code
            ]}
            fields={[
                { key: 'url', label: 'URL', type: 'text', placeholder: 'https://...' },
                {
                    key: 'method', label: 'Method', type: 'select',
                    options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                },
                { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}', rows: 2 },
            ]}
            fieldValues={values}
            onFieldChange={handleChange}
        />
    );
};
