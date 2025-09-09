'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_utils_1 = require('../../testing/test-utils');
const ppk_1 = require('./ppk');
const ppkTestUtils_1 = require('./ppkTestUtils');
describe('e2ee/ppk', () => {
	beforeEach(async () => {
		await (0, test_utils_1.setupDatabaseAndSynchronizer)(1);
		await (0, test_utils_1.switchClient)(1);
	});
	afterAll(async () => {
		await (0, test_utils_1.afterAllCleanUp)();
	});
	it('should create a public private key pair', async () => {
		const ppk = await (0, ppk_1.generateKeyPair)((0, test_utils_1.encryptionService)(), '111111');
		const privateKey = await (0, ppk_1.decryptPrivateKey)((0, test_utils_1.encryptionService)(), ppk.privateKey, '111111');
		const publicKey = ppk.publicKey;
		expect(privateKey).toContain('BEGIN RSA PRIVATE KEY');
		expect(privateKey).toContain('END RSA PRIVATE KEY');
		expect(privateKey.length).toBeGreaterThan(350);
		expect(publicKey).toContain('BEGIN RSA PUBLIC KEY');
		expect(publicKey).toContain('END RSA PUBLIC KEY');
		expect(publicKey.length).toBeGreaterThan(350);
	});
	it('should create different key pairs every time', async () => {
		const ppk1 = await (0, ppk_1.generateKeyPair)((0, test_utils_1.encryptionService)(), '111111');
		const ppk2 = await (0, ppk_1.generateKeyPair)((0, test_utils_1.encryptionService)(), '111111');
		const privateKey1 = await (0, ppk_1.decryptPrivateKey)((0, test_utils_1.encryptionService)(), ppk1.privateKey, '111111');
		const privateKey2 = await (0, ppk_1.decryptPrivateKey)((0, test_utils_1.encryptionService)(), ppk2.privateKey, '111111');
		const publicKey1 = ppk1.publicKey;
		const publicKey2 = ppk2.publicKey;
		expect(privateKey1).not.toBe(privateKey2);
		expect(publicKey1).not.toBe(publicKey2);
	});
	it('should encrypt a master key using PPK', (async () => {
		const ppk = await (0, ppk_1.generateKeyPair)((0, test_utils_1.encryptionService)(), '111111');
		const masterKey = await (0, ppk_1.ppkGenerateMasterKey)((0, test_utils_1.encryptionService)(), ppk, '111111');
		const plainText = await (0, ppk_1.ppkDecryptMasterKeyContent)((0, test_utils_1.encryptionService)(), masterKey, ppk, '111111');
		expect(plainText.length).toBeGreaterThan(50); // Just checking it's not empty
		expect(plainText).not.toBe(masterKey.content);
	}));
	it('should check if a PPK password is valid', (async () => {
		const ppk = await (0, ppk_1.generateKeyPair)((0, test_utils_1.encryptionService)(), '111111');
		expect(await (0, ppk_1.ppkPasswordIsValid)((0, test_utils_1.encryptionService)(), ppk, '222')).toBe(false);
		expect(await (0, ppk_1.ppkPasswordIsValid)((0, test_utils_1.encryptionService)(), ppk, '111111')).toBe(true);
		await (0, test_utils_1.expectThrow)(async () => (0, ppk_1.ppkPasswordIsValid)((0, test_utils_1.encryptionService)(), null, '111111'));
	}));
	it('should transmit key using a public-private key', (async () => {
		// This simulate sending a key from one user to another using
		// public-private key encryption. For example used when sharing a
		// notebook while E2EE is enabled.
		// User 1 generates a master key
		const key1 = await (0, test_utils_1.encryptionService)().generateMasterKey('mk_1111');
		// Using user 2 private key, he reencrypts the master key
		const ppk2 = await (0, ppk_1.generateKeyPair)((0, test_utils_1.encryptionService)(), 'ppk_1111');
		const ppkEncrypted = await (0, ppk_1.mkReencryptFromPasswordToPublicKey)((0, test_utils_1.encryptionService)(), key1, 'mk_1111', ppk2);
		// Once user 2 gets the master key, he can decrypt it using his private key
		const key2 = await (0, ppk_1.mkReencryptFromPublicKeyToPassword)((0, test_utils_1.encryptionService)(), ppkEncrypted, ppk2, 'ppk_1111', 'mk_2222');
		// Once it's done, both users should have the same master key
		const plaintext1 = await (0, test_utils_1.encryptionService)().decryptMasterKeyContent(key1, 'mk_1111');
		const plaintext2 = await (0, test_utils_1.encryptionService)().decryptMasterKeyContent(key2, 'mk_2222');
		expect(plaintext1).toBe(plaintext2);
		// We should make sure that the keys are also different when encrypted
		// since they should be using different passwords.
		expect(key1.content).not.toBe(key2.content);
	}));
	it('should decrypt and encrypt data from different devices', (async () => {
		await (0, test_utils_1.expectNotThrow)(async () => (0, ppkTestUtils_1.runIntegrationTests)(true));
	}));
});
// # sourceMappingURL=ppk.test.js.map
