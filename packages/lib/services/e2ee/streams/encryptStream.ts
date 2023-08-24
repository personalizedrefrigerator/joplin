import { EncryptionMethod, SJCLEncryptionMethod } from "../types";
import deriveSodiumKey from "../util/deriveSodiumKey";
import shim from "../../../shim";
import stringToArrayBuffer from "../util/stringToArrayBuffer";

type StreamEncryptor = AsyncGenerator<string>;

const sodiumEncrypt = async function* (
	masterKeyPlainText: string, input: AsyncIterableIterator<string>,
): StreamEncryptor {
	const sodium = await shim.libSodiumModule();
	const key = await deriveSodiumKey(masterKeyPlainText, sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES);

	const { header, state } = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);

	yield sodium.to_base64(header);

	let block = (await input.next()).value;
	let nextBlock;
	while (block) {
		nextBlock = (await input.next()).value;

		const blockBuffer = new Uint8Array(stringToArrayBuffer(block));

		const tag = nextBlock ? sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE : sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL;
		const cypherText = sodium.crypto_secretstream_xchacha20poly1305_push(
			state, blockBuffer, null, tag
		);
		yield sodium.to_base64(cypherText);

		block = nextBlock;
	}
};

const sjclEncrypt = async function* (
	method: SJCLEncryptionMethod, key: string, input: AsyncIterable<string>,
): StreamEncryptor {
	const sjcl = shim.sjclModule;

	const handlers: Record<SJCLEncryptionMethod, (plainText: string)=> Promise<string>> = {
		// 2020-01-23: Deprecated and no longer secure due to the use og OCB2 mode - do not use.
		[EncryptionMethod.SJCL]: plainText => {
			try {
				// Good demo to understand each parameter: https://bitwiseshiftleft.github.io/sjcl/demo/
				return sjcl.json.encrypt(key, plainText, {
					v: 1, // version
					iter: 1000, // Defaults to 1000 in sjcl but since we're running this on mobile devices, use a lower value. Maybe review this after some time. https://security.stackexchange.com/questions/3959/recommended-of-iterations-when-using-pkbdf2-sha256
					ks: 128, // Key size - "128 bits should be secure enough"
					ts: 64, // ???
					mode: 'ocb2', //  The cipher mode is a standard for how to use AES and other algorithms to encrypt and authenticate your message. OCB2 mode is slightly faster and has more features, but CCM mode has wider support because it is not patented.
					// "adata":"", // Associated Data - not needed?
					cipher: 'aes',
				});
			} catch (error) {
				throw this.wrapSjclError(error);
			}
		},

		// 2020-03-06: Added method to fix https://github.com/laurent22/joplin/issues/2591
		//             Also took the opportunity to change number of key derivations, per Isaac Potoczny's suggestion
		// 2023-06-10: Deprecated in favour of SJCL1b
		[EncryptionMethod.SJCL1a]: plainText => {
			try {
				// We need to escape the data because SJCL uses encodeURIComponent to process the data and it only
				// accepts UTF-8 data, or else it throws an error. And the notes might occasionally contain
				// invalid UTF-8 data. Fixes https://github.com/laurent22/joplin/issues/2591
				return sjcl.json.encrypt(key, escape(plainText), {
					v: 1, // version
					iter: 101, // Since the master key already uses key derivations and is secure, additional iteration here aren't necessary, which will make decryption faster. SJCL enforces an iter strictly greater than 100
					ks: 128, // Key size - "128 bits should be secure enough"
					ts: 64, // ???
					mode: 'ccm', //  The cipher mode is a standard for how to use AES and other algorithms to encrypt and authenticate your message. OCB2 mode is slightly faster and has more features, but CCM mode has wider support because it is not patented.
					// "adata":"", // Associated Data - not needed?
					cipher: 'aes',
				});
			} catch (error) {
				throw this.wrapSjclError(error);
			}
		},

		// 2023-06-10: Changed AES-128 to AES-256 per TheQuantumPhysicist's suggestions
		// https://github.com/laurent22/joplin/issues/7686
		[EncryptionMethod.SJCL1b]: plainText => {
			try {
				// We need to escape the data because SJCL uses encodeURIComponent to process the data and it only
				// accepts UTF-8 data, or else it throws an error. And the notes might occasionally contain
				// invalid UTF-8 data. Fixes https://github.com/laurent22/joplin/issues/2591
				return sjcl.json.encrypt(key, escape(plainText), {
					v: 1, // version
					iter: 101, // Since the master key already uses key derivations and is secure, additional iteration here aren't necessary, which will make decryption faster. SJCL enforces an iter strictly greater than 100
					ks: 256, // Key size - "256-bit is the golden standard that we should follow."
					ts: 64, // ???
					mode: 'ccm', //  The cipher mode is a standard for how to use AES and other algorithms to encrypt and authenticate your message. OCB2 mode is slightly faster and has more features, but CCM mode has wider support because it is not patented.
					// "adata":"", // Associated Data - not needed?
					cipher: 'aes',
				});
			} catch (error) {
				throw this.wrapSjclError(error);
			}
		},

		// 2020-01-23: Deprecated - see above.
		// Was used to encrypt master keys
		[EncryptionMethod.SJCL2]: plainText => {
			try {
				return sjcl.json.encrypt(key, plainText, {
					v: 1,
					iter: 10000,
					ks: 256,
					ts: 64,
					mode: 'ocb2',
					cipher: 'aes',
				});
			} catch (error) {
				throw this.wrapSjclError(error);
			}
		},

		// Don't know why we have this - it's not used anywhere. It must be
		// kept however, in case some note somewhere is encrypted using this
		// method.
		[EncryptionMethod.SJCL3]: plainText => {
			try {
				// Good demo to understand each parameter: https://bitwiseshiftleft.github.io/sjcl/demo/
				return sjcl.json.encrypt(key, plainText, {
					v: 1, // version
					iter: 1000, // Defaults to 1000 in sjcl. Since we're running this on mobile devices we need to be careful it doesn't affect performances too much. Maybe review this after some time. https://security.stackexchange.com/questions/3959/recommended-of-iterations-when-using-pkbdf2-sha256
					ks: 128, // Key size - "128 bits should be secure enough"
					ts: 64, // ???
					mode: 'ccm', //  The cipher mode is a standard for how to use AES and other algorithms to encrypt and authenticate your message. OCB2 mode is slightly faster and has more features, but CCM mode has wider support because it is not patented.
					// "adata":"", // Associated Data - not needed?
					cipher: 'aes',
				});
			} catch (error) {
				throw this.wrapSjclError(error);
			}
		},

		// Same as above but more secure (but slower) to encrypt master keys
		[EncryptionMethod.SJCL4]: plainText => {
			try {
				return sjcl.json.encrypt(key, plainText, {
					v: 1,
					iter: 10000,
					ks: 256,
					ts: 64,
					mode: 'ccm',
					cipher: 'aes',
				});
			} catch (error) {
				throw this.wrapSjclError(error);
			}
		},
	};

	const handler = handlers[method];

	for await (const block of input) {
		yield await handler(block);
	}
};

const encryptStream = (
	method: EncryptionMethod, masterKeyPlainText: string, stream: AsyncIterableIterator<string>
): StreamEncryptor => {
	if (method === EncryptionMethod.Sodium1) {
		return sodiumEncrypt(masterKeyPlainText, stream);
	}
	else if (method === EncryptionMethod.Custom) {
		throw new Error('Custom encryption method not supported here');
	}
	else {
		return sjclEncrypt(method, masterKeyPlainText, stream);
	}
};

export default encryptStream;
