'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rsa = exports.setRSA = void 0;
exports.decryptPrivateKey = decryptPrivateKey;
exports.generateKeyPair = generateKeyPair;
exports.pkReencryptPrivateKey = pkReencryptPrivateKey;
exports.ppkPasswordIsValid = ppkPasswordIsValid;
exports.ppkGenerateMasterKey = ppkGenerateMasterKey;
exports.ppkDecryptMasterKeyContent = ppkDecryptMasterKeyContent;
exports.mkReencryptFromPasswordToPublicKey = mkReencryptFromPasswordToPublicKey;
exports.mkReencryptFromPublicKeyToPassword = mkReencryptFromPublicKeyToPassword;
const uuid_1 = require('../../uuid');
const EncryptionService_1 = require('./EncryptionService');
let rsa_ = null;
const setRSA = (rsa) => {
	rsa_ = rsa;
};
exports.setRSA = setRSA;
const rsa = () => {
	if (!rsa_) { throw new Error('RSA handler has not been set!!'); }
	return rsa_;
};
exports.rsa = rsa;
async function encryptPrivateKey(encryptionService, password, plainText) {
	return {
		encryptionMethod: EncryptionService_1.EncryptionMethod.SJCL4,
		ciphertext: await encryptionService.encrypt(EncryptionService_1.EncryptionMethod.SJCL4, password, plainText),
	};
}
async function decryptPrivateKey(encryptionService, encryptedKey, password) {
	return encryptionService.decrypt(encryptedKey.encryptionMethod, password, encryptedKey.ciphertext);
}
async function generateKeyPair(encryptionService, password) {
	const keySize = 2048;
	const keyPair = await (0, exports.rsa)().generateKeyPair(keySize);
	return {
		id: uuid_1.default.createNano(),
		keySize,
		privateKey: await encryptPrivateKey(encryptionService, password, (0, exports.rsa)().privateKey(keyPair)),
		publicKey: (0, exports.rsa)().publicKey(keyPair),
		createdTime: Date.now(),
	};
}
async function pkReencryptPrivateKey(encryptionService, ppk, decryptionPassword, encryptionPassword) {
	const decryptedPrivate = await decryptPrivateKey(encryptionService, ppk.privateKey, decryptionPassword);
	return { ...ppk, privateKey: await encryptPrivateKey(encryptionService, encryptionPassword, decryptedPrivate) };
}
async function ppkPasswordIsValid(service, ppk, password) {
	if (!ppk) { throw new Error('PPK is undefined'); }
	try {
		await loadPpk(service, ppk, password);
	} catch (error) {
		return false;
	}
	return true;
}
async function loadPpk(service, ppk, password) {
	const privateKeyPlainText = await decryptPrivateKey(service, ppk.privateKey, password);
	return (0, exports.rsa)().loadKeys(ppk.publicKey, privateKeyPlainText, ppk.keySize);
}
async function loadPublicKey(publicKey, keySize) {
	return (0, exports.rsa)().loadKeys(publicKey, '', keySize);
}
function ppkEncryptionHandler(ppkId, rsaKeyPair) {
	return {
		context: {
			rsaKeyPair,
			ppkId,
		},
		encrypt: async (context, hexaBytes, _password) => {
			return JSON.stringify({
				ppkId: context.ppkId,
				ciphertext: await (0, exports.rsa)().encrypt(hexaBytes, context.rsaKeyPair),
			});
		},
		decrypt: async (context, ciphertext, _password) => {
			const parsed = JSON.parse(ciphertext);
			if (parsed.ppkId !== context.ppkId) { throw new Error(`Needs private key ${parsed.ppkId} to decrypt, but using ${context.ppkId}`); }
			return (0, exports.rsa)().decrypt(parsed.ciphertext, context.rsaKeyPair);
		},
	};
}
// Generates a master key and encrypts it using the provided PPK
async function ppkGenerateMasterKey(service, ppk, password) {
	const nodeRSA = await loadPpk(service, ppk, password);
	const handler = ppkEncryptionHandler(ppk.id, nodeRSA);
	return service.generateMasterKey('', {
		encryptionMethod: EncryptionService_1.EncryptionMethod.Custom,
		encryptionHandler: handler,
	});
}
// Decrypt the content of a master key that was encrypted using ppkGenerateMasterKey()
async function ppkDecryptMasterKeyContent(service, masterKey, ppk, password) {
	const nodeRSA = await loadPpk(service, ppk, password);
	const handler = ppkEncryptionHandler(ppk.id, nodeRSA);
	return service.decryptMasterKeyContent(masterKey, '', {
		encryptionHandler: handler,
	});
}
async function mkReencryptFromPasswordToPublicKey(service, masterKey, decryptionPassword, encryptionPublicKey) {
	const loadedPublicKey = await loadPublicKey(encryptionPublicKey.publicKey, encryptionPublicKey.keySize);
	const encryptionHandler = ppkEncryptionHandler(encryptionPublicKey.id, loadedPublicKey);
	const plainText = await service.decryptMasterKeyContent(masterKey, decryptionPassword);
	const newContent = await service.encryptMasterKeyContent(EncryptionService_1.EncryptionMethod.Custom, plainText, '', { encryptionHandler });
	return { ...masterKey, ...newContent };
}
async function mkReencryptFromPublicKeyToPassword(service, masterKey, decryptionPpk, decryptionPassword, encryptionPassword) {
	const decryptionHandler = ppkEncryptionHandler(decryptionPpk.id, await loadPpk(service, decryptionPpk, decryptionPassword));
	const plainText = await service.decryptMasterKeyContent(masterKey, '', { encryptionHandler: decryptionHandler });
	const newContent = await service.encryptMasterKeyContent(null, plainText, encryptionPassword);
	return { ...masterKey, ...newContent };
}
// # sourceMappingURL=ppk.js.map
