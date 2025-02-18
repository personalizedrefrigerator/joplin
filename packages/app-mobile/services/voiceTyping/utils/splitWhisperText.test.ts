import splitWhisperText from './splitWhisperText';

describe('splitWhisperText', () => {
	test.each([
		{
			// Should trim at sentence breaks
			input: '<|0|> This is a test. <|5000|><|6000|> This is another sentence. <|7000|>',
			recordingLength: 8,
			expected: {
				trimTo: 6,
				dataBeforeTrim: '<|0|> This is a test. ',
				dataAfterTrim: ' This is another sentence. <|7000|>',
			},
		},
		{
			// Should prefer sentence break splits to non sentence break splits
			input: '<|0|> This is <|4000|><|4050|> a test. <|5000|><|5050|> Testing, <|6000|><|7000|> this is a test. <|8000|>',
			recordingLength: 8,
			expected: {
				trimTo: 5.50,
				dataBeforeTrim: '<|0|> This is <|4000|><|4050|> a test. ',
				dataAfterTrim: ' Testing, <|6000|><|7000|> this is a test. <|8000|>',
			},
		},
		{
			// Should avoid splitting for very small timestamps
			input: '<|0|> This is a test. <|2000|><|2030|> Testing! <|3000|>',
			recordingLength: 4,
			expected: {
				trimTo: 0,
				dataBeforeTrim: '',
				dataAfterTrim: ' This is a test. <|2000|><|2030|> Testing! <|3000|>',
			},
		},
		{
			// For larger timestamps, should allow splitting at pauses, even if not on sentence breaks.
			input: '<|0|> This is a test, <|10000|><|12000|> of splitting on timestamps. <|15000|>',
			recordingLength: 16,
			expected: {
				trimTo: 12,
				dataBeforeTrim: '<|0|> This is a test, ',
				dataAfterTrim: ' of splitting on timestamps. <|15000|>',
			},
		},
		{
			// Should prefer to break at the end, if a large gap after the last timestamp.
			input: '<|0|> This is a test, <|10000|><|12000|> of splitting on timestamps. <|15000|>',
			recordingLength: 30,
			expected: {
				trimTo: 15,
				dataBeforeTrim: '<|0|> This is a test, <|10000|><|12000|> of splitting on timestamps. ',
				dataAfterTrim: '',
			},
		},
	])('should prefer to split at the end of sentences (case %#)', ({ input, recordingLength, expected }) => {
		const actual = splitWhisperText(input, recordingLength);
		expect(actual.trimTo).toBeCloseTo(expected.trimTo);
		expect(actual.dataBeforeTrim).toBe(expected.dataBeforeTrim);
		expect(actual.dataAfterTrim).toBe(expected.dataAfterTrim);
	});
});
