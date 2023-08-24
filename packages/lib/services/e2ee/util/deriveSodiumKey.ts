import shim from "../../../shim";

// Derives a shorter key for use with libsodium -- libsodium has
// a much smaller maximum key size for most operations than SJCL. 
const deriveSodiumKey = async (masterKey: string, outputKeyLength: number) => {
	const sodium = await shim.libSodiumModule();
	const binaryMasterKey = sodium.from_base64(masterKey);

	// TODO(REQUIRED): Switch to the streams API: https://doc.libsodium.org/secret-key_cryptography/secretstream
	// TODO(REQUIRED): Is this really okay to do??? Our master keys are *much* longer (384 bytes) than
	//                 the 32 bytes required by libsodium.
	//                 Key derivation by generichash is suggested by
	//                 https://github.com/jedisct1/libsodium/issues/347#issuecomment-372721843
	//                 but the post is quite old.
	//                 ...is this really okay?
	const subkey = sodium.crypto_generichash(
		outputKeyLength,
		binaryMasterKey,
	);

	return subkey;
};

export default deriveSodiumKey;