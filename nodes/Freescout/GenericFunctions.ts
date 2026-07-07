import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

export function normalizeBaseUrl(url: string): string {
	return (url ?? '').replace(/\/+$/, '');
}

/** Remove empty-string/null/undefined values from a flat object. */
function pruneEmpty(obj: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v !== '' && v !== null && v !== undefined) out[k] = v;
	}
	return out;
}

export function buildCustomerObject(fields: IDataObject): IDataObject {
	return pruneEmpty(fields);
}

/**
 * Declarative postReceive: unwrap FreeScout's HAL envelope.
 * List responses look like { _embedded: { conversations: [...] }, page: {...} }.
 * Single-object responses are returned as-is.
 */
export function embeddedPostReceive(key: string) {
	return async function (
		this: IExecuteSingleFunctions,
		_items: INodeExecutionData[],
		response: IN8nHttpFullResponse,
	): Promise<INodeExecutionData[]> {
		const body = response.body as IDataObject;
		const embedded = (body?._embedded as IDataObject) ?? {};
		const list = embedded[key];
		if (Array.isArray(list)) {
			return (list as IDataObject[]).map((json) => ({ json }));
		}
		if (body && typeof body === 'object' && '_embedded' in body) {
			return [];
		}
		return [{ json: body ?? {} }];
	};
}

/** Assemble the create-conversation body from flat node parameters. */
export async function presendConversationBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = (requestOptions.body as IDataObject) ?? {};
	const customer = buildCustomerObject((body.customer as IDataObject) ?? {});
	if (Object.keys(customer).length) body.customer = customer;
	requestOptions.body = pruneEmpty(body);
	return requestOptions;
}

/** Assemble the create-thread body from flat node parameters. */
export async function presendThreadBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = pruneEmpty((requestOptions.body as IDataObject) ?? {});
	return requestOptions;
}
