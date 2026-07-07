import { describe, it, expect } from 'vitest';
import { normalizeBaseUrl, buildCustomerObject } from '../GenericFunctions';

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
	it('maps email into an emails array entry and keeps names', () => {
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
