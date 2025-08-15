import type { webcrypto } from 'node:crypto';
import { PublicKeyAlgorithm } from '../../types';
import StringToBufferAdapter from './StringToBufferAdapter';
import WebCryptoRsa, { WebCryptoSlice } from './WebCryptoRsa';

const buildRsaCryptoProvider = (rsaMode: PublicKeyAlgorithm, crypto: WebCryptoSlice|typeof webcrypto) => {
	// Cast: Old versions of @types/node don't include crypto.subtle:
	const cryptoSlice = crypto as unknown as WebCryptoSlice;
	if (rsaMode === PublicKeyAlgorithm.RsaV2) {
		return new StringToBufferAdapter(
			new WebCryptoRsa(
				cryptoSlice,
				{ modulusLengthBits: 4096 },
			),
		);
	} else {
		throw new Error(`Unsupported mode for webCrypto: ${rsaMode}`);
	}
};

export default buildRsaCryptoProvider;
