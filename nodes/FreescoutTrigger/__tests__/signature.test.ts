// No `vitest` import — globals are enabled via vitest.config.mjs (strict mode bans the import).
import { webhookSecret, computeSignature, verifySignature } from '../GenericFunctions';
import { createHash, createHmac } from 'crypto';

const APP_KEY = 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const BODY = '{"id":123,"type":"email"}';

// Reference values computed with the exact FreeScout formula.
const expectedSecret = createHash('md5').update(APP_KEY + 'webhook_key').digest('hex');
const expectedSig = createHmac('sha1', expectedSecret).update(BODY).digest('base64');

describe('webhook signature', () => {
	it('derives the secret as md5(appKey + "webhook_key")', () => {
		expect(webhookSecret(APP_KEY)).toBe(expectedSecret);
	});
	it('computes base64 HMAC-SHA1 over the raw body', () => {
		expect(computeSignature(BODY, APP_KEY)).toBe(expectedSig);
	});
	it('verifies a correct signature', () => {
		expect(verifySignature(BODY, expectedSig, APP_KEY)).toBe(true);
	});
	it('rejects a wrong signature', () => {
		expect(verifySignature(BODY, 'wrong', APP_KEY)).toBe(false);
	});
	it('rejects a missing signature when appKey is set', () => {
		expect(verifySignature(BODY, undefined, APP_KEY)).toBe(false);
	});
	it('accepts (skips verification) when appKey is empty', () => {
		expect(verifySignature(BODY, undefined, '')).toBe(true);
	});
});
