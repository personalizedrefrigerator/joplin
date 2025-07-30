import { PublicKeyAlgorithm, PublicKeyCrypto, RSA, RSAKeyPair } from '../types';
import * as NodeRSA from 'node-rsa';
import WebCryptoRsa from './WebCryptoRsa';

const legacyRSAOptions: NodeRSA.Options = {
	// Must use pkcs1 otherwise any data encrypted with NodeRSA will crash the
	// app when decrypted by RN-RSA.
	// https://github.com/amitaymolko/react-native-rsa-native/issues/66#issuecomment-932768139
	encryptionScheme: 'pkcs1',
};

const legacyRsa: PublicKeyCrypto = {

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

	loadKeys: async (publicKey: string, privateKey: string): Promise<RSAKeyPair> => {
		const keys = new NodeRSA();
		keys.setOptions(legacyRSAOptions);
		// Don't specify the import format, and let it auto-detect because
		// react-native-rsa might not create a key in the expected format.
		keys.importKey(publicKey);
		if (privateKey) keys.importKey(privateKey);
		return keys;
	},

	encrypt: async (plaintextUtf8: string, rsaKeyPair: RSAKeyPair): Promise<string> => {
		return rsaKeyPair.encrypt(plaintextUtf8, 'base64', 'utf8');
	},

	decrypt: async (ciphertextBase64: string, rsaKeyPair: RSAKeyPair): Promise<string> => {
		return rsaKeyPair.decrypt(ciphertextBase64, 'utf8');
	},

	publicKey: async (rsaKeyPair: RSAKeyPair) => {
		return rsaKeyPair.exportKey('pkcs1-public-pem');
	},

	privateKey: async (rsaKeyPair: RSAKeyPair) => {
		return rsaKeyPair.exportKey('pkcs1-private-pem');
	},

};

const webCryptoRsa = new WebCryptoRsa(crypto);

const rsa: RSA = {
	fromAlgorithm: (algorithm) => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			return legacyRsa;
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return webCryptoRsa;
		} else {
			const exhaustivenessCheck: never = algorithm;
			throw new Error(`Unknown algorithm: ${exhaustivenessCheck}`);
		}
	},
	algorithmInfo: (algorithm) => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			return { supported: true, deprecated: true };
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return { supported: true, deprecated: false };
		} else {
			return { supported: false, deprecated: undefined };
		}
	},
};

export default rsa;
