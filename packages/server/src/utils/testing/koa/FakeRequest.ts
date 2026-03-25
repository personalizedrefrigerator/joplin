interface RequestSlice {
	method: string;
}

export default class FakeRequest {

	private req_: RequestSlice;

	public constructor(nodeRequest: RequestSlice) {
		this.req_ = nodeRequest;
	}

	public get method(): string {
		return this.req_.method || 'GET';
	}

}
