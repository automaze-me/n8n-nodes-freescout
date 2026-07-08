import type { INodeProperties } from 'n8n-workflow';

/**
 * FreeScout paginates with page/pageSize (1-based) and returns
 * page.totalPages. This drives declarative "Return All" pagination.
 */
export const paginationOperation = {
	pagination: {
		type: 'generic' as const,
		properties: {
			continue: '={{ $response.body.page.number < $response.body.page.totalPages }}',
			request: {
				qs: {
					page: '={{ ($response.body.page.number || 0) + 1 }}',
				},
			},
		},
	},
};

export function paginationFields(resource: string, operation: string): INodeProperties[] {
	const show = { resource: [resource], operation: [operation] };
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
			routing: {
				operations: paginationOperation,
				send: { paginate: '={{ $value }}' },
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				send: { type: 'query', property: 'pageSize' },
				output: { maxResults: '={{ $value }}' },
			},
		},
	];
}
