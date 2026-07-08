// No `vitest` import — globals are enabled via vitest.config.mjs (strict mode bans the import).
import { computeSignature, verifySignature } from '../GenericFunctions';
import { createHmac } from 'crypto';

// The FreeScout "Secret Key" (Manage → API & Webhooks) is a 32-char md5 hex string.
// It is used directly as the HMAC key — the node does not re-hash it.
const SECRET = '5f4dcc3b5aa765d61d8327deb882cf99';
const BODY = '{"id":123,"type":"email"}';

// Reference signature computed with the exact FreeScout formula: base64(HMAC-SHA1(body, secret)).
const expectedSig = createHmac('sha1', SECRET).update(BODY).digest('base64');

describe('webhook signature', () => {
	it('computes base64 HMAC-SHA1 over the raw body using the secret directly', () => {
		expect(computeSignature(BODY, SECRET)).toBe(expectedSig);
	});
	it('verifies a correct signature', () => {
		expect(verifySignature(BODY, expectedSig, SECRET)).toBe(true);
	});
	it('rejects a wrong signature', () => {
		expect(verifySignature(BODY, 'wrong', SECRET)).toBe(false);
	});
	it('rejects a missing signature when a secret is set', () => {
		expect(verifySignature(BODY, undefined, SECRET)).toBe(false);
	});
	it('accepts (skips verification) when no secret is set', () => {
		expect(verifySignature(BODY, undefined, '')).toBe(true);
	});
});
