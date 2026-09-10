import selfsigned from 'selfsigned';
import https from 'node:https';
import http from 'node:http';

const startListening = (server: https.Server|http.Server) => {
	const listeningPromise = new Promise<void>((resolve, reject) => {
		const onError = (error: Error) => {
			server.off('listening', onListening);
			reject(error);
		};
		const onListening = () => {
			resolve();
			server.off('error', onError);
		};

		server.once('listening', onListening);
		server.once('error', onError);
	});
	// Arbitrary port
	server.listen(0, 'localhost');

	return listeningPromise;
};

interface Options {
	https: boolean;
}

const createLocalhostServer = async (requestHandler: http.RequestListener, { https: useHttps }: Options) => {
	// See https://github.com/jfromaniello/selfsigned#custom-extensions
	const keyPair = useHttps ? await selfsigned.generate(
		[{ name: 'commonName', value: 'localhost' }],
		{
			extensions: [
				{
					name: 'basicConstraints',
					cA: false,
				},
				{
					name: 'keyUsage',
					digitalSignature: true,
					keyEncipherment: true,
				},
				{
					name: 'subjectAltName',
					altNames: [
						// DNS
						{ type: 2, value: 'localhost' },
						// IPv4 / IPv6
						{ type: 7, ip: '127.0.0.1' },
						{ type: 7, ip: '::1' },
					],
				},
			],
		},
	) : undefined;

	const server = keyPair ? https.createServer({
		key: keyPair.private,
		cert: keyPair.cert,
	}, requestHandler) : http.createServer(requestHandler);

	await startListening(server);

	const address = server.address();
	if (typeof address === 'string') {
		throw new Error('Unexpected server.address() return type (expected AddressInfo)');
	}

	return {
		baseUrl: `${useHttps ? 'https:' : 'http:'}//localhost:${address.port}`,
		port: address.port,
		cert: keyPair?.cert,
		server,

		[Symbol.asyncDispose]() {
			return new Promise<void>((resolve, reject) => {
				server.close((error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});
		},
	};
};

export default createLocalhostServer;
