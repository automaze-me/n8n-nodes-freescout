import { createHmac, timingSafeEqual } from 'crypto';

/**
 * FreeScout signs each webhook delivery with:
 *   X-FreeScout-Signature = base64( HMAC-SHA1( rawBody, secret ) )
 * where `secret` is the "Secret Key" shown in FreeScout under
 * Manage → API & Webhooks (internally `md5(APP_KEY . 'webhook_key')`).
 * The node uses that Secret Key value directly as the HMAC key.
 */
export function computeSignature(rawBody: string, secret: string): string {
	return createHmac('sha1', secret).update(rawBody, 'utf8').digest('base64');
}

export function verifySignature(
	rawBody: string,
	header: string | undefined,
	secret: string,
): boolean {
	// Verification disabled when no secret is configured.
	if (!secret) return true;
	if (!header) return false;
	const expected = computeSignature(rawBody, secret);
	const a = Buffer.from(expected);
	const b = Buffer.from(header);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
