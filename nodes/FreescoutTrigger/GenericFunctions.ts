import { createHash, createHmac, timingSafeEqual } from 'crypto';

export function webhookSecret(appKey: string): string {
	return createHash('md5').update(appKey + 'webhook_key').digest('hex');
}

export function computeSignature(rawBody: string, appKey: string): string {
	return createHmac('sha1', webhookSecret(appKey)).update(rawBody, 'utf8').digest('base64');
}

export function verifySignature(
	rawBody: string,
	header: string | undefined,
	appKey: string,
): boolean {
	// Verification disabled when no app key is configured.
	if (!appKey) return true;
	if (!header) return false;
	const expected = computeSignature(rawBody, appKey);
	const a = Buffer.from(expected);
	const b = Buffer.from(header);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
