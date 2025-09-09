'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const NodeRSA = require('node-rsa');
const nodeRSAOptions = {
	// Must use pkcs1 otherwise any data encrypted with NodeRSA will crash the
	// app when decrypted by RN-RSA.
	// https://github.com/amitaymolko/react-native-rsa-native/issues/66#issuecomment-932768139
	encryptionScheme: 'pkcs1',
	// Allows NodeRSA to work with pkcs1-v1.5 in newer NodeJS versions:
	environment: 'browser',
};
const rsa = {
	generateKeyPair: async (keySize) => {
		const keys = new NodeRSA();
		keys.setOptions(nodeRSAOptions);
		keys.generateKeyPair(keySize, 65537);
		// Sanity check
		if (!keys.isPrivate()) { throw new Error('No private key was generated'); }
		if (!keys.isPublic()) { throw new Error('No public key was generated'); }
		return keys;
	},
	loadKeys: async (publicKey, privateKey) => {
		const keys = new NodeRSA();
		keys.setOptions(nodeRSAOptions);
		// Don't specify the import format, and let it auto-detect because
		// react-native-rsa might not create a key in the expected format.
		keys.importKey(publicKey);
		if (privateKey) { keys.importKey(privateKey); }
		return keys;
	},
	encrypt: async (plaintextUtf8, rsaKeyPair) => {
		return rsaKeyPair.encrypt(plaintextUtf8, 'base64', 'utf8');
	},
	decrypt: async (ciphertextBase64, rsaKeyPair) => {
		return rsaKeyPair.decrypt(ciphertextBase64, 'utf8');
	},
	publicKey: (rsaKeyPair) => {
		return rsaKeyPair.exportKey('pkcs1-public-pem');
	},
	privateKey: (rsaKeyPair) => {
		return rsaKeyPair.exportKey('pkcs1-private-pem');
	},
};
exports.default = rsa;
// # sourceMappingURL=RSA.node.js.map
