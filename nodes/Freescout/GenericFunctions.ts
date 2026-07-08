import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

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
		// Single-resource GETs (possibly carrying _embedded sub-resources) pass through as the whole object.
		return [{ json: body ?? {} }];
	};
}

/**
 * Build a single FreeScout thread object from a "Threads" fixedCollection entry.
 * Only meaningful fields are emitted; empties are dropped so the API gets a clean
 * payload (`user` is only sent for message/note when > 0; `customer` only when an
 * email is given; `cc`/`bcc` only when non-empty).
 */
export function buildThread(entry: IDataObject): IDataObject {
	const thread: IDataObject = { type: entry.type, text: entry.text };
	if (entry.type === 'customer') {
		const email = ((entry.customerEmail as string) ?? '').trim();
		if (email) thread.customer = { email };
	} else if (typeof entry.user === 'number' && entry.user > 0) {
		thread.user = entry.user;
	}
	// State / CC / BCC / Imported live in a per-thread "Options" collection
	// (the "Add option" button), so they are only present when the user added them.
	const opts = (entry.options as IDataObject) ?? {};
	if (opts.state) thread.state = opts.state;
	if (opts.imported === true) thread.imported = true;
	for (const key of ['cc', 'bcc'] as const) {
		const value = opts[key];
		if (Array.isArray(value) && value.length) thread[key] = value;
	}
	return thread;
}

/** Build the FreeScout `threads` array from the "Threads" fixedCollection value. */
export function buildThreadsFromUi(threadsUi: IDataObject): IDataObject[] {
	const entries = (threadsUi?.thread as IDataObject[]) ?? [];
	return entries.map(buildThread);
}

/** Assemble the create-conversation body: nested customer + the threads array. */
export async function presendConversationBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = (requestOptions.body as IDataObject) ?? {};
	const customer = buildCustomerObject((body.customer as IDataObject) ?? {});
	if (Object.keys(customer).length) body.customer = customer;

	const mode = (this.getNodeParameter('threadInputMode', 'fields') as string) || 'fields';
	if (mode === 'json') {
		const raw = this.getNodeParameter('threadsJson', []) as string | IDataObject[];
		try {
			body.threads = typeof raw === 'string' ? JSON.parse(raw) : raw;
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid JSON in "Threads (JSON)": ${(error as Error).message}`,
			);
		}
	} else {
		body.threads = buildThreadsFromUi(this.getNodeParameter('threadsUi', {}) as IDataObject);
	}

	if (!Array.isArray(body.threads) || body.threads.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'A conversation requires at least one thread. Add a thread before running.',
		);
	}

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
