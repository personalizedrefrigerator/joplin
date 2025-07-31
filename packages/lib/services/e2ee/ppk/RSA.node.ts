import { PublicKeyAlgorithm, PublicKeyCrypto, PublicKeyCryptoProvider } from '../types';
import * as NodeRSA from 'node-rsa';
import WebCryptoRsa, { WebCryptoSlice } from './WebCryptoRsa';
import { webcrypto } from 'crypto';

const legacyRSAOptions: NodeRSA.Options = {
	// Must use pkcs1 otherwise any data encrypted with NodeRSA will crash the
	// app when decrypted by RN-RSA.
	// https://github.com/amitaymolko/react-native-rsa-native/issues/66#issuecomment-932768139
	encryptionScheme: 'pkcs1',
};

const legacyRsa: PublicKeyCrypto<NodeRSA> = {

	generateKeyPair: async () => {
		const keys = new NodeRSA();
		keys.setOptions(legacyRSAOptions);
		const keySize = 2048;
		keys.generateKeyPair(keySize, 65537);

		// Sanity check
		if (!keys.isPrivate()) throw new Error('No private key was generated');
		if (!keys.isPublic()) throw new Error('No public key was generated');

		return { keyPair: keys, keySize };
	},

	loadKeys: async (publicKey: string, privateKey: string) => {
		const keys = new NodeRSA();
		keys.setOptions(legacyRSAOptions);
		// Don't specify the import format, and let it auto-detect because
		// react-native-rsa might not create a key in the expected format.
		keys.importKey(publicKey);
		if (privateKey) keys.importKey(privateKey);
		return keys;
	},

	encrypt: async (plaintextUtf8: string, rsaKeyPair: NodeRSA) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Workaround for incorrect types after improving type safety
		return rsaKeyPair.encrypt(plaintextUtf8 as any, 'base64', 'utf8');
	},

	decrypt: async (ciphertextBase64: string, rsaKeyPair: NodeRSA) => {
		return rsaKeyPair.decrypt(ciphertextBase64, 'utf8');
	},

	publicKey: async (rsaKeyPair: NodeRSA) => {
		return rsaKeyPair.exportKey('pkcs1-public-pem');
	},

	privateKey: async (rsaKeyPair: NodeRSA) => {
		return rsaKeyPair.exportKey('pkcs1-private-pem');
	},

};

const webCryptoRsa = new WebCryptoRsa(
	// Cast: Old versions of @types/node don't include crypto.subtle:
	webcrypto as WebCryptoSlice,
);

const rsa: PublicKeyCryptoProvider = {
	from: (algorithm) => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			return legacyRsa;
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return webCryptoRsa;
		} else if (algorithm === PublicKeyAlgorithm.Unknown) {
			throw new Error('Unknown PPK algorithm.');
		} else {
			const exhaustivenessCheck: never = algorithm;
			throw new Error(`Unknown algorithm: ${exhaustivenessCheck}`);
		}
	},
	supportsAlgorithm: (algorithm) => {
		return algorithm === PublicKeyAlgorithm.RsaLegacy || algorithm === PublicKeyAlgorithm.RsaV2;
	},
};

export default rsa;
