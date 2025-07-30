import WebCryptoRsa from '@joplin/lib/services/e2ee/ppk/WebCryptoRsa';
import { PublicKeyAlgorithm, PublicKeyCrypto, RSA } from '@joplin/lib/services/e2ee/types';

const webCryptoRsa = new WebCryptoRsa(crypto);

const rsa: RSA = {
	fromAlgorithm: (algorithm: PublicKeyAlgorithm): PublicKeyCrypto => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			throw new Error('RsaLegacy is not supported on web.');
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return webCryptoRsa;
		} else {
			const exhaustivenessCheck: never = algorithm;
			throw new Error(`Unsupported public key algorithm: ${exhaustivenessCheck}`);
		}
	},
	algorithmInfo: (algorithm) => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			return {
				supported: false,
				deprecated: true,
			};
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return {
				supported: true,
				deprecated: false,
			};
		} else {
			return {
				supported: false,
				deprecated: undefined,
			};
		}
	},
};

export default rsa;
