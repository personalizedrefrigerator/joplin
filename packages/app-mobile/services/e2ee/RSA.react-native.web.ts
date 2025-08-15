import buildRsaCryptoProvider from '@joplin/lib/services/e2ee/ppk/webCrypto/buildRsaCryptoProvider';
import { PublicKeyAlgorithm, PublicKeyCrypto, PublicKeyCryptoProvider } from '@joplin/lib/services/e2ee/types';

const webCryptoRsa = buildRsaCryptoProvider(PublicKeyAlgorithm.RsaV2, crypto);

const rsa: PublicKeyCryptoProvider = {
	from: (algorithm: PublicKeyAlgorithm): PublicKeyCrypto => {
		if (algorithm === PublicKeyAlgorithm.RsaV1) {
			throw new Error('RsaV1 is not supported on web.');
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
