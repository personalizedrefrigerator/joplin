import { RSA } from '@joplin/lib/services/e2ee/types';
const RnRSA = require('react-native-rsa-native').RSA;

interface RSAKeyPair {
	public: string;
	private: string;
}

const rsa: RSA = {

	generateKeyPair: async (keySize: number): Promise<RSAKeyPair> => {
		const keys: RSAKeyPair = await RnRSA.generateKeys(keySize);

		// Sanity check
		if (!keys.private) throw new Error('No private key was generated');
		if (!keys.public) throw new Error('No public key was generated');

		return keys;
	},

	loadKeys: async (publicKey: string, privateKey: string): Promise<RSAKeyPair> => {
		return { public: publicKey, private: privateKey };
	},

	encrypt: async (plaintextUtf8: string, rsaKeyPair: RSAKeyPair): Promise<string> => {
		return RnRSA.encrypt(plaintextUtf8, rsaKeyPair.public);
	},

	decrypt: async (ciphertextBase64: string, rsaKeyPair: RSAKeyPair): Promise<string> => {
		const ctBuffer = Buffer.from(ciphertextBase64, 'base64');
		const pkLength = Buffer.from(rsaKeyPair.private, 'base64').byteLength;
		console.log('pkLength', pkLength, Buffer.from(rsaKeyPair.public, 'base64').byteLength);
		if (ctBuffer.length > 256) {
			const maxMessageLength = 256;// - 11; // -11: Padding
			const numBlocks = Math.ceil(ctBuffer.length / maxMessageLength);
			const blockSize = ctBuffer.length / numBlocks;

			const result: string[] = [];
			for (let i = 0; i < numBlocks; i++) {
				const ctBlock = ctBuffer.slice(i * blockSize, Math.min(ctBuffer.length, (i + 1) * blockSize));
				const plainText = await RnRSA.decrypt(ctBlock.toString('base64'), rsaKeyPair.private);
				if (plainText === undefined) {
					throw new Error(`RN RSA: Decryption failed.`);
				}
				result.push(plainText);
			}
			return result.join('');
		} else {
			return RnRSA.decrypt(ciphertextBase64, rsaKeyPair.private);
		}
	},

	publicKey: (rsaKeyPair: RSAKeyPair): string => {
		return rsaKeyPair.public;
	},

	privateKey: (rsaKeyPair: RSAKeyPair): string => {
		return rsaKeyPair.private;
	},

};

export default rsa;
