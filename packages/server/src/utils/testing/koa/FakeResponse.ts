type HeaderValue = string|number|boolean;

export default class FakeResponse {

	public status = 200;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public body: any = null;
	private headers_: Record<string, HeaderValue> = {};

	public set(name: string, value: HeaderValue) {
		this.headers_[name] = value;
	}

	public get(name: string): HeaderValue {
		return this.headers_[name];
	}

}
