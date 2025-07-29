import WebCryptoRsa, { WebCryptoSlice } from '@joplin/lib/services/e2ee/ppk/WebCryptoRsa';
import { PublicKeyAlgorithm, PublicKeyCrypto, RSA } from '@joplin/lib/services/e2ee/types';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';
import QuickCrypto from 'react-native-quick-crypto';
const RnRSA = require('react-native-rsa-native').RSA;

interface LegacyRSAKeyPair {
	public: string;
	private: string;
	keySizeBits: number;
}

const logger = Logger.create('RSA');

const legacyRsa: PublicKeyCrypto = {
	generateKeyPair: async () => {
		if (shim.mobilePlatform() === 'web') {
			// TODO: Try to implement with SubtleCrypto. May require migrating the RSA algorithm used on
			// desktop and mobile (which is not supported on web). See commit 12adcd9dbc3f723bac36ff4447701573084c4694.
			logger.warn('RSA on web is not yet supported.');
			return null;
		}

		const keySize = 2048;
		const keys: LegacyRSAKeyPair = await RnRSA.generateKeys(keySize);

		// Sanity check
		if (!keys.private) throw new Error('No private key was generated');
		if (!keys.public) throw new Error('No public key was generated');

		const keyPair = await legacyRsa.loadKeys(keys.public, keys.private, keySize);
		return {
			keyPair,
			keySize,
		};
	},

	loadKeys: async (publicKey: string, privateKey: string, keySizeBits: number): Promise<LegacyRSAKeyPair> => {
		return { public: publicKey, private: privateKey, keySizeBits };
	},

	encrypt: async (plaintextUtf8: string, rsaKeyPair: LegacyRSAKeyPair): Promise<string> => {
		// TODO: Support long-data encryption in a way compatible with node-rsa.
		return RnRSA.encrypt(plaintextUtf8, rsaKeyPair.public);
	},

	decrypt: async (ciphertextBase64: string, rsaKeyPair: LegacyRSAKeyPair): Promise<string> => {
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

	publicKey: async (rsaKeyPair: LegacyRSAKeyPair) => {
		return rsaKeyPair.public;
	},

	privateKey: async (rsaKeyPair: LegacyRSAKeyPair) => {
		return rsaKeyPair.private;
	},
};

const webCryptoRsa = new WebCryptoRsa({
	subtle: QuickCrypto.subtle
} as WebCryptoSlice);

const rsa: RSA = {
	fromAlgorithm: (algorithm: PublicKeyAlgorithm): PublicKeyCrypto => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			return legacyRsa;
		} else if (algorithm === PublicKeyAlgorithm.RsaOaep) {
			return webCryptoRsa;
		} else {
			const exhaustivenessCheck: never = algorithm;
			throw new Error(`Unsupported public key algorithm: ${exhaustivenessCheck}`);
		}
	},
	algorithmInfo: (algorithm) => {
		if (algorithm === PublicKeyAlgorithm.RsaLegacy) {
			return {
				supported: shim.mobilePlatform() !== 'web',
				deprecated: true,
			};
		} else if (algorithm === PublicKeyAlgorithm.RsaOaep) {
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
	}
};

export default rsa;
