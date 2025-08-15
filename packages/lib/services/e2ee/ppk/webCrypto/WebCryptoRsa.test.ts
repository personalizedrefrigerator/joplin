import { webcrypto } from 'node:crypto';
import buildRsaCryptoProvider from './buildRsaCryptoProvider';
import { PublicKeyAlgorithm } from '../../types';


describe('WebCryptoRsa', () => {
	// The default error message when a message is larger than the maximum length
	// can be confusing. Verifies that a better message is provided:
	test('should encrypt data up to the maximum length, then throw', async () => {
		const rsaProvider = buildRsaCryptoProvider(PublicKeyAlgorithm.RsaV2, webcrypto);
		const { keyPair, keySize: keySizeBits } = await rsaProvider.generateKeyPair();

		// Should handle the case where given empty input
		const expectedOutputLength = Buffer.alloc(keySizeBits / 8).toString('base64').length;
		expect(await rsaProvider.encrypt('', keyPair)).toHaveLength(expectedOutputLength);

		const maximumLength = 444;
		for (let length = 1; length <= maximumLength; length++) {
			// WebCryptoRsa adds 1 byte of metadata:
			const hexData = Buffer.alloc(length).toString('hex');
			// Verify that it encrypts without throwing
			await expect(rsaProvider.encrypt(hexData, keyPair)).resolves.toHaveLength(expectedOutputLength);
		}

		for (let length = maximumLength + 1; length <= maximumLength * 2; length++) {
			const hexData = Buffer.alloc(length).toString('hex');
			await expect(() => rsaProvider.encrypt(hexData, keyPair)).rejects.toThrow(/Data too long/);
		}
	});

	test('output should not contain the input (medium-length input)', async () => {
		const rsaProvider = buildRsaCryptoProvider(PublicKeyAlgorithm.RsaV2, webcrypto);
		const { keyPair } = await rsaProvider.generateKeyPair();

		for (const hexInput of ['123456789aa', '111aaaabbbbccccddddaa', '567890aaa']) {
			expect(await rsaProvider.encrypt(hexInput, keyPair)).not.toContain(hexInput);
			expect(await rsaProvider.encrypt(hexInput, keyPair)).not.toContain(
				Buffer.from(hexInput, 'hex').toString('base64'),
			);
		}
	});
});
