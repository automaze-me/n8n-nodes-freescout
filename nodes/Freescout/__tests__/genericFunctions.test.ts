import type { IExecuteSingleFunctions, IN8nHttpFullResponse, INodeExecutionData } from 'n8n-workflow';
import {
	normalizeBaseUrl,
	buildCustomerObject,
	embeddedPostReceive,
	buildThread,
	buildThreadsFromUi,
} from '../GenericFunctions';

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

describe('buildThread', () => {
	it('builds a message thread with user, omitting empty extras', () => {
		expect(buildThread({ type: 'message', text: 'Hi', user: 7 })).toEqual({
			type: 'message',
			text: 'Hi',
			user: 7,
		});
	});

	it('builds a note thread with user', () => {
		expect(buildThread({ type: 'note', text: 'internal', user: 3 })).toEqual({
			type: 'note',
			text: 'internal',
			user: 3,
		});
	});

	it('omits user when not a positive number (message/note)', () => {
		expect(buildThread({ type: 'message', text: 'Hi', user: 0 })).toEqual({
			type: 'message',
			text: 'Hi',
		});
	});

	it('builds a customer thread with a nested customer email', () => {
		expect(buildThread({ type: 'customer', text: 'Reply', customerEmail: 'm@x.io' })).toEqual({
			type: 'customer',
			text: 'Reply',
			customer: { email: 'm@x.io' },
		});
	});

	it('omits customer when no email given (falls back to conversation customer server-side)', () => {
		expect(buildThread({ type: 'customer', text: 'Reply', customerEmail: '' })).toEqual({
			type: 'customer',
			text: 'Reply',
		});
	});

	it('includes state, imported and non-empty cc/bcc from the options collection', () => {
		expect(
			buildThread({
				type: 'message',
				text: 'Hi',
				user: 1,
				options: {
					state: 'draft',
					imported: true,
					cc: ['a@x.io'],
					bcc: [],
				},
			}),
		).toEqual({
			type: 'message',
			text: 'Hi',
			user: 1,
			state: 'draft',
			imported: true,
			cc: ['a@x.io'],
		});
	});

	it('omits optional fields when no options are added', () => {
		expect(buildThread({ type: 'message', text: 'Hi', user: 1 })).toEqual({
			type: 'message',
			text: 'Hi',
			user: 1,
		});
	});
});

describe('buildThreadsFromUi', () => {
	it('maps each collection entry to a thread', () => {
		const ui = {
			thread: [
				{ type: 'message', text: 'First', user: 1 },
				{ type: 'note', text: 'Second', user: 2 },
			],
		};
		expect(buildThreadsFromUi(ui)).toEqual([
			{ type: 'message', text: 'First', user: 1 },
			{ type: 'note', text: 'Second', user: 2 },
		]);
	});

	it('returns an empty array when there are no entries', () => {
		expect(buildThreadsFromUi({})).toEqual([]);
	});
});
