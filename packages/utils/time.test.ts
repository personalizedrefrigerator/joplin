import { formatMsToDurationLocal, Hour, Minute } from './time';

describe('time', () => {
	test.each([
		[0, '0:00'],
		[Minute * 3, '3:00'],
		[Hour * 4 + Minute * 3, '4:03:00'],
		[Hour * 25, '0000-00-01T01:00'],
	])('should support formatting durations', (input, expected) => {
		expect(formatMsToDurationLocal(input)).toBe(expected);
	});
});
