import { PublicKeyCrypto } from "../types";

export type WebCryptoSlice = {
	subtle: Pick<SubtleCrypto, 'generateKey'|'importKey'|'encrypt'|'decrypt'|'exportKey'>;
};

interface KeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey|null;
}

const isHexadecimalString = (text: string) => {
	for (let i = 0; i < text.length; i += 2) {
		if (!text.substring(i, i + 2).match(/^[a-fA-F0-9]{2}/)) {
			return false;
		}
	}
	return true;
};

const modulusLength = 4096;
export default class WebCryptoRsa implements PublicKeyCrypto {
	public constructor(private webCrypto_: WebCryptoSlice) {}

	public async generateKeyPair() {
		const keyPair = await this.webCrypto_.subtle.generateKey({
			name: 'RSA-OAEP',
			modulusLength,
			// See https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams#publicexponent
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
		}
		const publicKey = await importKey(publicKeySource, ['encrypt']);
		const privateKey = privateKeySource ? await importKey(privateKeySource, ['decrypt']) : null;
		return {
			publicKey,
			privateKey,
		};
	}

	public async encrypt(plaintext: string, rsaKeyPair: KeyPair) {
		if (!rsaKeyPair.publicKey) {
			throw new Error('Missing public key');
		}
		const isHex = isHexadecimalString(plaintext);

		// RSA can only encrypt a limited amount of data. If given hexadecimal data, try to encrypt in that format.
		let data = isHex ? Buffer.from(plaintext, 'hex') : Buffer.from(plaintext, 'utf8');

		// Store the original data format
		if (isHex) {
			data = Buffer.concat([data, new Uint8Array([1])]);
		} else {
			data = Buffer.concat([data, new Uint8Array([0])]);
		}

		if (data.byteLength >= modulusLength / 8) {
			// Fail early -- the error provided by webCrypto when the data is too long is often
			// difficult to understand.
			throw new Error('Data too long');
		}

		const buffer = await this.webCrypto_.subtle.encrypt(
			{ name: 'RSA-OAEP' }, rsaKeyPair.publicKey, data,
		);
		return Buffer.from(buffer).toString('base64');
	}

	public async decrypt(ciphertextBase64: string, rsaKeyPair: KeyPair) {
		if (!rsaKeyPair.privateKey) {
			throw new Error('Missing private key');
		}

		let buffer = Buffer.from(await this.webCrypto_.subtle.decrypt(
			{ name: 'RSA-OAEP' }, rsaKeyPair.privateKey, Buffer.from(ciphertextBase64, 'base64'),
		));

		let encoding: BufferEncoding;
		const isHex = buffer.readUint8(buffer.byteLength - 1) === 1;
		if (isHex) {
			encoding = 'hex';
		} else {
			encoding = 'utf8';
		}

		buffer = buffer.slice(0, buffer.byteLength - 1);
		return Buffer.from(buffer).toString(encoding);
	}

	public async publicKey(rsaKeyPair: KeyPair) {
		return JSON.stringify(
			await this.webCrypto_.subtle.exportKey('jwk', rsaKeyPair.publicKey)
		);
	}

	public async privateKey(rsaKeyPair: KeyPair) {
		if (!rsaKeyPair.privateKey) {
			throw new Error('Missing private key');
		}

		return JSON.stringify(
			await this.webCrypto_.subtle.exportKey('jwk', rsaKeyPair.privateKey)
		);
	}
}