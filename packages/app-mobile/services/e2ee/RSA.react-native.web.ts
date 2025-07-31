import WebCryptoRsa from '@joplin/lib/services/e2ee/ppk/WebCryptoRsa';
import { PublicKeyAlgorithm, PublicKeyCrypto, PublicKeyCryptoProvider } from '@joplin/lib/services/e2ee/types';

const webCryptoRsa = new WebCryptoRsa(crypto);

const rsa: PublicKeyCryptoProvider = {
	from: (algorithm: PublicKeyAlgorithm): PublicKeyCrypto => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			throw new Error('RsaLegacy is not supported on web.');
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return webCryptoRsa;
		} else if (algorithm === PublicKeyAlgorithm.Unknown) {
			throw new Error('Unsupported algorithm.');
		} else {
			const exhaustivenessCheck: never = algorithm;
			throw new Error(`Unsupported public key algorithm: ${exhaustivenessCheck}`);
		}
	},
	supportsAlgorithm: (algorithm) => {
		return algorithm === PublicKeyAlgorithm.RsaV2;
	},
};

export default rsa;
