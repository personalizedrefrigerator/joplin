import { WebCryptoSlice } from '@joplin/lib/services/e2ee/ppk/WebCryptoRsa';
import buildRsaCryptoProvider from '@joplin/lib/services/e2ee/ppk/webCrypto/buildRsaCryptoProvider';
import { PublicKeyAlgorithm, PublicKeyCrypto, PublicKeyCryptoProvider } from '@joplin/lib/services/e2ee/types';
import QuickCrypto from 'react-native-quick-crypto';
const RnRSA = require('react-native-rsa-native').RSA;

interface LegacyRsaKeyPair {
	public: string;
	private: string;
	keySizeBits: number;
}

const legacyRsa: PublicKeyCrypto = {
	generateKeyPair: async () => {
		const keySize = 2048;
		const keys: LegacyRsaKeyPair = await RnRSA.generateKeys(keySize);

		// Sanity check
		if (!keys.private) throw new Error('No private key was generated');
		if (!keys.public) throw new Error('No public key was generated');

		const keyPair = await legacyRsa.loadKeys(keys.public, keys.private, keySize);
		return {
			keyPair,
			keySize,
		};
	},

	maximumPlaintextLengthBytes: 190,

	loadKeys: async (publicKey: string, privateKey: string, keySizeBits: number): Promise<LegacyRsaKeyPair> => {
		return { public: publicKey, private: privateKey, keySizeBits };
	},

	encrypt: async (plaintextUtf8: string, rsaKeyPair: LegacyRsaKeyPair): Promise<string> => {
		// TODO: Support long-data encryption in a way compatible with node-rsa.
		return RnRSA.encrypt(plaintextUtf8, rsaKeyPair.public);
	},

	decrypt: async (ciphertextBase64: string, rsaKeyPair: LegacyRsaKeyPair): Promise<string> => {
		const ciphertextBuffer = Buffer.from(ciphertextBase64, 'base64');
		const maximumEncryptedSize = Math.floor(rsaKeyPair.keySizeBits / 8); // Usually 256

		// On iOS, .decrypt fails without throwing or rejecting.
		// This function throws for consistency with Android.
		const handleError = (plainText: string|undefined) => {
			if (plainText === undefined) {
				throw new Error(`
					RN RSA: Decryption failed.
						cipherTextLength=${ciphertextBuffer.length},
						maxEncryptedSize=${maximumEncryptedSize}
				`.trim());
			}
		};

		// Master keys are encrypted with RSA and are longer than the default modulus size of 256 bytes.
		// node-rsa supports encrypting larger amounts of data using RSA.
		// See their implementation for details: https://github.com/rzcoder/node-rsa/blob/e7e7f7d2942a3bac1d2e132a881e5a3aceda10a1/src/libs/rsa.js#L252
		if (ciphertextBuffer.length > maximumEncryptedSize) {
			// Use a numBlocks and blockSize that match node-rsa:
			const numBlocks = Math.ceil(ciphertextBuffer.length / maximumEncryptedSize);
			const blockSize = maximumEncryptedSize;

			const result: string[] = [];
			for (let i = 0; i < numBlocks; i++) {
				const ciphertextBlock = ciphertextBuffer.slice(
					i * blockSize, Math.min(ciphertextBuffer.length, (i + 1) * blockSize),
				);
				const plainText = await RnRSA.decrypt(ciphertextBlock.toString('base64'), rsaKeyPair.private);

				handleError(plainText);
				result.push(plainText);
			}
			return result.join('');
		} else {
			const plainText = await RnRSA.decrypt(ciphertextBase64, rsaKeyPair.private);
			handleError(plainText);
			return plainText;
		}
	},

	publicKey: async (rsaKeyPair: LegacyRsaKeyPair) => {
		return rsaKeyPair.public;
	},

	privateKey: async (rsaKeyPair: LegacyRsaKeyPair) => {
		return rsaKeyPair.private;
	},
};

const webCryptoRsa = buildRsaCryptoProvider(PublicKeyAlgorithm.RsaV2, QuickCrypto as WebCryptoSlice);

const rsa: PublicKeyCryptoProvider = {
	from: (algorithm: PublicKeyAlgorithm): PublicKeyCrypto => {
		if (algorithm === PublicKeyAlgorithm.RsaV1) {
			return legacyRsa;
		} else if (algorithm === PublicKeyAlgorithm.RsaV2) {
			return webCryptoRsa;
		} else if (algorithm === PublicKeyAlgorithm.Unknown) {
			throw new Error('Unsupported algorithm');
		} else {
			const exhaustivenessCheck: never = algorithm;
			throw new Error(`Unsupported public key algorithm: ${exhaustivenessCheck}`);
		}
	},
	supportsAlgorithm: (algorithm) => {
		return algorithm === PublicKeyAlgorithm.RsaV1 || algorithm === PublicKeyAlgorithm.RsaV2;
	},
};

export default rsa;
