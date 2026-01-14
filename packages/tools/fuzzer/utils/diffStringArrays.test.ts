import diffStringArrays from './diffStringArrays';

describe('diffStringArrays', () => {
	test.each([
		[
			['a'],
			[],
			{ unexpected: ['a'], missing: [] },
		],
		[
			['a', 'b'],
			['a', 'b'],
			{ unexpected: [], missing: [] },
		],
		[
			[],
			['a'],
			{ unexpected: [], missing: ['a'] },
		],
		[
			['a'],
			['b', 'c'],
			{ unexpected: ['a'], missing: ['b', 'c'] },
		],
		[
			['a', 'b', 'c', 'd', 'e', 'f'],
			['a', 'e'],
			{ unexpected: ['b', 'c', 'd', 'f'], missing: [] },
		],
	])('should diff string arrays: %j, %j', (actual, expected, diff) => {
		expect(diffStringArrays(actual, expected)).toEqual(diff);
	});
});

