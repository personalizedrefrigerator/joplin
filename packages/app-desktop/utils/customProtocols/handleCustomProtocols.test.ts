/** @jest-environment node */

type ProtocolHandler = (request: Request)=> Promise<Response>;
const customProtocols: Map<string, ProtocolHandler> = new Map();

const handleProtocolMock = jest.fn((scheme: string, handler: ProtocolHandler) => {
	customProtocols.set(scheme, handler);
});
const fetchMock = jest.fn(async url => new Response(`Mock response to ${url}`));

jest.doMock('electron', () => {
	return {
		net: {
			fetch: fetchMock,
		},
		protocol: {
			handle: handleProtocolMock,
		},
	};
});

import Logger from '@joplin/utils/Logger';
import handleCustomProtocols from './handleCustomProtocols';


describe('handleCustomProtocols', () => {
	beforeEach(() => {
		// Reset mocks between tests to ensure a clean testing environment.
		customProtocols.clear();
		handleProtocolMock.mockClear();
		fetchMock.mockClear();
	});

	test('should only allow access to files in allowed directories', async () => {
		const logger = Logger.create('test-logger');
		const protocolHandler = handleCustomProtocols(logger);

		// Should have registered the protocol
		expect(handleProtocolMock).toHaveBeenCalledTimes(1);
		const lastCallArgs = handleProtocolMock.mock.lastCall;
		expect(lastCallArgs[0]).toBe('joplin-content');

		const onRequestListener = lastCallArgs[1];

		const expectPathToBeBlocked = async (filePath: string) => {
			const url = `joplin-content://note-viewer/${filePath}`;

			await expect(
				async () => await onRequestListener(new Request(url)),
			).rejects.toThrowError('Read access not granted for URL');
		};

		const expectPathToBeUnblocked = async (filePath: string) => {
			const handleRequestResult = await onRequestListener(new Request(`joplin-content://note-viewer/${filePath}`));
			expect(handleRequestResult.body).toBeTruthy();
		};

		await expectPathToBeBlocked('/test/path');
		await expectPathToBeBlocked('/');

		protocolHandler.allowReadAccessToDirectory('/test/path/');
		await expectPathToBeUnblocked('/test/path');
		await expectPathToBeUnblocked('/test/path/a.txt');
		await expectPathToBeUnblocked('/test/path/b.txt');

		await expectPathToBeBlocked('/');
		await expectPathToBeBlocked('/test/path2');
		await expectPathToBeBlocked('/test/path/../a.txt');

		protocolHandler.allowReadAccessToDirectory('/another/path/here');

		await expectPathToBeBlocked('/another/path/here2');
		await expectPathToBeUnblocked('/another/path/here');
		await expectPathToBeUnblocked('/another/path/here/2');
	});
});
