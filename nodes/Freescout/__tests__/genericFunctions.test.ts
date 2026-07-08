import type { IExecuteSingleFunctions, IN8nHttpFullResponse, INodeExecutionData } from 'n8n-workflow';
import { normalizeBaseUrl, buildCustomerObject, embeddedPostReceive } from '../GenericFunctions';

describe('normalizeBaseUrl', () => {
	it('strips a single trailing slash', () => {
		expect(normalizeBaseUrl('https://x.io/')).toBe('https://x.io');
	});
	it('strips multiple trailing slashes', () => {
		expect(normalizeBaseUrl('https://x.io///')).toBe('https://x.io');
	});
	it('leaves a clean url unchanged', () => {
		expect(normalizeBaseUrl('https://x.io')).toBe('https://x.io');
	});
});

describe('buildCustomerObject', () => {
	it('keeps provided fields', () => {
		expect(buildCustomerObject({ firstName: 'Mark', email: 'm@x.io' })).toEqual({
			firstName: 'Mark',
			email: 'm@x.io',
		});
	});
	it('drops empty values', () => {
		expect(buildCustomerObject({ firstName: 'Mark', lastName: '' })).toEqual({
			firstName: 'Mark',
		});
	});
});

describe('embeddedPostReceive', () => {
	it('unwraps array from _embedded[key]', async () => {
		const fn = embeddedPostReceive('conversations');
		const response = {
			body: {
				_embedded: {
					conversations: [{ id: 1 }, { id: 2 }],
				},
				page: {},
			},
		} as unknown as IN8nHttpFullResponse;
		const result = await fn.call({} as unknown as IExecuteSingleFunctions, [] as INodeExecutionData[], response);
		expect(result).toEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
	});

	it('wraps entire body when no _embedded exists', async () => {
		const fn = embeddedPostReceive('customers');
		const response = {
			body: {
				id: 75,
				firstName: 'Mark',
			},
		} as unknown as IN8nHttpFullResponse;
		const result = await fn.call({} as unknown as IExecuteSingleFunctions, [] as INodeExecutionData[], response);
		expect(result).toEqual([{ json: { id: 75, firstName: 'Mark' } }]);
	});

	it('passes single-resource GET with embedded sub-resources through as whole object', async () => {
		const fn = embeddedPostReceive('conversations');
		const response = {
			body: {
				id: 5,
				subject: 'Hi',
				_embedded: {
					threads: [{ id: 9 }],
				},
			},
		} as unknown as IN8nHttpFullResponse;
		const result = await fn.call({} as unknown as IExecuteSingleFunctions, [] as INodeExecutionData[], response);
		expect(result).toEqual([{ json: { id: 5, subject: 'Hi', _embedded: { threads: [{ id: 9 }] } } }]);
	});
});
