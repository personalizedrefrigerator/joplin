

// eslint-disable-next-line import/prefer-default-export -- For now, only one export has been extracted from @joplin/lib/string-utils
export function substrWithEllipsis(s: string, start: number, length: number) {
	if (s.length <= length) return s;
	return `${s.substring(start, length - 3)}...`;
}
