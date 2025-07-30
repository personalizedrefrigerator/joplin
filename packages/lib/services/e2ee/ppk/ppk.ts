import uuid from '../../../uuid';
import EncryptionService, { EncryptionCustomHandler, EncryptionMethod } from '../EncryptionService';
import { MasterKeyEntity, PublicKeyAlgorithm, RSA, RSAKeyPair } from '../types';

interface PrivateKey {
	encryptionMethod: EncryptionMethod;
	ciphertext: string;
}

export type PublicKey = string;

export interface PublicPrivateKeyPair {
	id: string;
	keySize: number;
	publicKey: PublicKey;
	privateKey: PrivateKey;
	algorithm: PublicKeyAlgorithm;
	createdTime: number;
}

export type PublicPrivateKeyPairs = {
	[algorithm in PublicKeyAlgorithm]?: PublicPrivateKeyPair;
};

let rsa_: RSA = null;

export const setRSA = (rsa: RSA) => {
	rsa_ = rsa;
};

export const rsa = (): RSA => {
	if (!rsa_) throw new Error('RSA handler has not been set!!');
	return rsa_;
};

export const getPreferredAlgorithm = (algorithms: PublicKeyAlgorithm[]) => {
	const supported = algorithms.filter(algorithm => rsa().algorithmInfo(algorithm).supported);
	const nonDeprecated = supported.filter(algorithm => !rsa().algorithmInfo(algorithm).deprecated);

	if (nonDeprecated.length) {
		return nonDeprecated[0];
	}
	if (supported.length) {
		return supported[0];
	}

	return null;
};

async function encryptPrivateKey(encryptionService: EncryptionService, password: string, plainText: string): Promise<PrivateKey> {
	return {
		encryptionMethod: EncryptionMethod.SJCL4,
		ciphertext: await encryptionService.encrypt(EncryptionMethod.SJCL4, password, plainText),
	};
}

export async function decryptPrivateKey(encryptionService: EncryptionService, encryptedKey: PrivateKey, password: string): Promise<string> {
	return encryptionService.decrypt(encryptedKey.encryptionMethod, password, encryptedKey.ciphertext);
}

export const generateKeyPairWithAlgorithm = async (algorithm: PublicKeyAlgorithm, encryptionService: EncryptionService, password: string): Promise<PublicPrivateKeyPair> => {
	const { keyPair, keySize } = await rsa().fromAlgorithm(algorithm).generateKeyPair();

	return {
		id: uuid.createNano(),
		algorithm,
		keySize,
		privateKey: await encryptPrivateKey(
			encryptionService, password, await rsa().fromAlgorithm(algorithm).privateKey(keyPair),
		),
		publicKey: await rsa().fromAlgorithm(algorithm).publicKey(keyPair),
		createdTime: Date.now(),
	};
};

export async function generateKeyPair(encryptionService: EncryptionService, password: string): Promise<PublicPrivateKeyPair> {
	return generateKeyPairWithAlgorithm(PublicKeyAlgorithm.RsaOaep, encryptionService, password);
}

export async function pkReencryptPrivateKey(encryptionService: EncryptionService, ppk: PublicPrivateKeyPair, decryptionPassword: string, encryptionPassword: string): Promise<PublicPrivateKeyPair> {
	const decryptedPrivate = await decryptPrivateKey(encryptionService, ppk.privateKey, decryptionPassword);

	return {
		...ppk,
		privateKey: await encryptPrivateKey(encryptionService, encryptionPassword, decryptedPrivate),
	};
}

export async function ppkPasswordIsValid(service: EncryptionService, ppk: PublicPrivateKeyPair, password: string): Promise<boolean> {
	if (!ppk) throw new Error('PPK is undefined');

	try {
		await loadPpk(service, ppk, password);
	} catch (error) {
		return false;
	}

	return true;
}

const ppkToAlgorithm = (ppk: PublicPrivateKeyPair) => {
	return ppk.algorithm ?? PublicKeyAlgorithm.RsaLegacy;
};

async function loadPpk(service: EncryptionService, ppk: PublicPrivateKeyPair, password: string): Promise<RSAKeyPair> {
	const privateKeyPlainText = await decryptPrivateKey(service, ppk.privateKey, password);
	return rsa().fromAlgorithm(ppkToAlgorithm(ppk)).loadKeys(ppk.publicKey, privateKeyPlainText, ppk.keySize);
}

async function loadPublicKey(algorithm: PublicKeyAlgorithm, publicKey: PublicKey, keySize: number): Promise<RSAKeyPair> {
	return rsa().fromAlgorithm(algorithm).loadKeys(publicKey, '', keySize);
}

function ppkEncryptionHandler(algorithm: PublicKeyAlgorithm, ppkId: string, rsaKeyPair: RSAKeyPair): EncryptionCustomHandler {
	interface Context {
		rsaKeyPair: RSAKeyPair;
		ppkId: string;
		algorithm: PublicKeyAlgorithm;
	}

	return {
		context: {
			rsaKeyPair,
			ppkId,
			algorithm,
		},
		encrypt: async (context: Context, hexaBytes: string, _password: string): Promise<string> => {
			return JSON.stringify({
				ppkId: context.ppkId,
				ciphertext: await rsa().fromAlgorithm(context.algorithm).encrypt(hexaBytes, context.rsaKeyPair),
			});
		},
		decrypt: async (context: Context, ciphertext: string, _password: string): Promise<string> => {
			const parsed = JSON.parse(ciphertext);
			if (parsed.ppkId !== context.ppkId) throw new Error(`Needs private key ${parsed.ppkId} to decrypt, but using ${context.ppkId}`);
			return rsa().fromAlgorithm(context.algorithm).decrypt(parsed.ciphertext, context.rsaKeyPair);
		},
	};
}

// Generates a master key and encrypts it using the provided PPK
export async function ppkGenerateMasterKey(service: EncryptionService, ppk: PublicPrivateKeyPair, password: string): Promise<MasterKeyEntity> {
	const nodeRSA = await loadPpk(service, ppk, password);
	const handler = ppkEncryptionHandler(ppkToAlgorithm(ppk), ppk.id, nodeRSA);

	return service.generateMasterKey('', {
		encryptionMethod: EncryptionMethod.Custom,
		encryptionHandler: handler,
	});
}

// Decrypt the content of a master key that was encrypted using ppkGenerateMasterKey()
export async function ppkDecryptMasterKeyContent(service: EncryptionService, masterKey: MasterKeyEntity, ppk: PublicPrivateKeyPair, password: string): Promise<string> {
	const nodeRSA = await loadPpk(service, ppk, password);
	const handler = ppkEncryptionHandler(ppkToAlgorithm(ppk), ppk.id, nodeRSA);

	return service.decryptMasterKeyContent(masterKey, '', {
		encryptionHandler: handler,
	});
}

export async function mkReencryptFromPasswordToPublicKey(service: EncryptionService, masterKey: MasterKeyEntity, decryptionPassword: string, encryptionPublicKey: PublicPrivateKeyPair): Promise<MasterKeyEntity> {
	const algorithm = ppkToAlgorithm(encryptionPublicKey);
	const loadedPublicKey = await loadPublicKey(
		algorithm, encryptionPublicKey.publicKey, encryptionPublicKey.keySize,
	);
	const encryptionHandler = ppkEncryptionHandler(algorithm, encryptionPublicKey.id, loadedPublicKey);

	const plainText = await service.decryptMasterKeyContent(masterKey, decryptionPassword);
	const newContent = await service.encryptMasterKeyContent(EncryptionMethod.Custom, plainText, '', { encryptionHandler });

	return { ...masterKey, ...newContent };
}

export async function mkReencryptFromPublicKeyToPassword(service: EncryptionService, masterKey: MasterKeyEntity, decryptionPpk: PublicPrivateKeyPair, decryptionPassword: string, encryptionPassword: string): Promise<MasterKeyEntity> {
	const decryptionHandler = ppkEncryptionHandler(
		ppkToAlgorithm(decryptionPpk), decryptionPpk.id, await loadPpk(service, decryptionPpk, decryptionPassword),
	);

	const plainText = await service.decryptMasterKeyContent(masterKey, '', { encryptionHandler: decryptionHandler });
	const newContent = await service.encryptMasterKeyContent(null, plainText, encryptionPassword);

	return { ...masterKey, ...newContent };
}
