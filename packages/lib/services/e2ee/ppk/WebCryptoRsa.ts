import { PublicKeyCrypto } from '../types';

export type WebCryptoSlice = {
	subtle: Pick<SubtleCrypto, 'generateKey'|'importKey'|'encrypt'|'decrypt'|'exportKey'>;
};

interface KeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey|null;
}

const isLowercaseHexadecimalString = (text: string) => {
	for (let i = 0; i < text.length; i += 2) {
		if (!text.substring(i, i + 2).match(/^[a-f0-9]{2}/)) {
			return false;
		}
	}
	return true;
};

const modulusLength = 4096;
export default class WebCryptoRsa implements PublicKeyCrypto {
	public constructor(private webCrypto_: WebCryptoSlice) {}

	public async generateKeyPair() {
		// See the RSA dom example:
		// https://github.com/mdn/dom-examples/blob/8c3d2a9781204e60b52371e300aebf067cd0b876/web-crypto/encrypt-decrypt/rsa-oaep.js#L71
		// and the relevant MDN documentation:
		// https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
		const keyPair = await this.webCrypto_.subtle.generateKey({
			name: 'RSA-OAEP',
			modulusLength,
			// From https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams#publicexponent
			// "Unless you have a good reason to use something else, specify 65537 here ([0x01, 0x00, 0x01])."
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: 'SHA-256',
		}, true, ['encrypt', 'decrypt']);

		return {
			keyPair: keyPair as CryptoKeyPair,
			keySize: modulusLength,
		};
	}

	public async loadKeys(publicKeySource: string, privateKeySource: string): Promise<KeyPair> {
		const importKey = (keySource: string, usages: KeyUsage[]) => {
			return this.webCrypto_.subtle.importKey(
				'jwk', JSON.parse(keySource), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, usages,
			);
		};
		const publicKey = await importKey(publicKeySource, ['encrypt']);
		const privateKey = privateKeySource ? await importKey(privateKeySource, ['decrypt']) : null;
		return {
			publicKey,
			privateKey,
		};
	}

	private textToBuffer_(textUtf8: string) {
		// To avoid data loss when restoring (whether everything is capital or lowercase), work only
		// with lowercase hexadecimal.
		const isHex = isLowercaseHexadecimalString(textUtf8);

		// RSA can only encrypt a limited amount of data. If given hexadecimal data (e.g. when given
		// a Joplin master key), try to encrypt in that format.
		let data = isHex ? Buffer.from(textUtf8, 'hex') : Buffer.from(textUtf8, 'utf8');

		// Store the original data format with a single-byte suffix.
		if (isHex) {
			data = Buffer.concat([data, new Uint8Array([1])]);
		} else {
			data = Buffer.concat([data, new Uint8Array([0])]);
		}

		return data;
	}

	private bufferToText_(buffer: Buffer) {
		let encoding: BufferEncoding;
		const isHex = buffer.readUInt8(buffer.byteLength - 1) === 1;
		if (isHex) {
			encoding = 'hex';
		} else {
			encoding = 'utf8';
		}

		// Use .slice for mobile compatibility:
		buffer = buffer.slice(0, buffer.byteLength - 1);
		return Buffer.from(buffer).toString(encoding);
	}

	public async encrypt(plaintextUtf8: string, rsaKeyPair: KeyPair) {
		if (!rsaKeyPair.publicKey) {
			throw new Error('Missing public key');
		}

		const plaintextBuffer = this.textToBuffer_(plaintextUtf8);
		if (plaintextBuffer.byteLength >= modulusLength / 8) {
			// Fail early -- the error provided by webCrypto when the data is too long is often
			// difficult to understand.
			throw new Error('Data too long');
		}

		const ciphertext = await this.webCrypto_.subtle.encrypt(
			{ name: 'RSA-OAEP' }, rsaKeyPair.publicKey, plaintextBuffer,
		);
		return Buffer.from(ciphertext).toString('base64');
	}

	public async decrypt(ciphertextBase64: string, rsaKeyPair: KeyPair) {
		if (!rsaKeyPair.privateKey) {
			throw new Error('Missing private key');
		}

		const plaintextBuffer = Buffer.from(await this.webCrypto_.subtle.decrypt(
			{ name: 'RSA-OAEP' }, rsaKeyPair.privateKey, Buffer.from(ciphertextBase64, 'base64'),
		));
		return this.bufferToText_(plaintextBuffer);
	}

	private async exportKey_(key: CryptoKey) {
		const exported = { ...await this.webCrypto_.subtle.exportKey('jwk', key) };

		// Remove padding -- When running in React Native, JWK base64URL fields are padded with "."s.
		// Chromium fails to import such keys, with a comment that the "JSON web signature spec says that padding is omitted."
		// See https://github.com/chromium/chromium/blob/dd96966cf845460bad4bc352625b9188e98ae501/components/webcrypto/jwk.cc#L309
		const base64Members = ['n', 'e', 'qi', 'dp', 'dq', 'q', 'p', 'd'];
		const result = Object.create(null);
		for (const [key, value] of Object.entries(exported)) {
			if (base64Members.includes(key) && typeof value === 'string') {
				// react-native-quick-crypto uses "."s for padding:
				result[key] = value.replace(/\.+$/, '');
			} else {
				result[key] = value;
			}
		}

		return JSON.stringify(result);
	}

	public async publicKey(rsaKeyPair: KeyPair) {
		return this.exportKey_(rsaKeyPair.publicKey);
	}

	public async privateKey(rsaKeyPair: KeyPair) {
		if (!rsaKeyPair.privateKey) {
			throw new Error('Missing private key');
		}

		return this.exportKey_(rsaKeyPair.privateKey);
	}
}
