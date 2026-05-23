// Keyword object accepted by markKeyword. May be passed as a plain string,
// which is then normalised to the text form internally.
export interface KeywordObject {
	type: 'text' | 'regex';
	value: string;
	scriptType?: string;
	accuracy?: string;
}

export type Keyword = string | KeywordObject;

const isInsideContainer = (node: Node | null, tagName: string): boolean => {
	if (!node) return false;

	tagName = tagName.toLowerCase();

	while (node) {
		const element = node as Element;
		if (element.tagName && element.tagName.toLowerCase() === tagName) return true;
		node = node.parentNode;
	}

	return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mark.js does not ship its own types and is loaded via require() at the call site
const markKeyword = (mark: any, keyword: Keyword, extraOptions: Record<string, unknown> = null) => {
	let normalized: KeywordObject;
	if (typeof keyword === 'string') {
		normalized = {
			type: 'text',
			value: keyword,
		};
	} else {
		normalized = keyword;
	}

	const isBasicSearch = ['ja', 'zh', 'ko'].indexOf(normalized.scriptType) >= 0;

	let value = normalized.value;

	const getAccuracy = (k: KeywordObject) => {
		if (isBasicSearch) return 'partially';
		if (k.type === 'regex') return 'complementary';
		if (k.accuracy) return k.accuracy;
		return k.value.length >= 2 ? 'partially' : { value: 'exactly', limiters: ':;.,-–—‒_(){}[]!\'"+='.split('') };
	};

	const accuracy = getAccuracy(normalized);

	if (normalized.type === 'regex') {
		// Remove the trailing wildcard and "accuracy = complementary" will take
		// care of highlighting the relevant keywords.

		// Known bug: it will also highlight word that contain the term as a
		// suffix for example for "ent*", it will highlight "present" which is
		// incorrect (it should only highlight what starts with "ent") but for
		// now will do. Mark.js doesn't have an option to tweak this behaviour.
		value = normalized.value.substr(0, normalized.value.length - 1);
	}

	mark.mark(
		[value],
		{

			accuracy: accuracy,
			filter: (node: Node, _term: string, _termCounter: number, _counter: number) => {
				// We exclude SVG because it creates a "<mark>" tag inside
				// the document, which is not a valid SVG tag. As a result
				// the content within that tag disappears.
				//
				// mark.js has an "exclude" parameter, but it doesn't work
				// so we use "filter" instead.
				//
				// https://github.com/joplin/plugin-abc-sheet-music
				if (isInsideContainer(node, 'SVG')) return false;

				// We exclude joplin-source because it contains the raw source
				// for editable blocks (mermaid diagrams, etc.). If we highlight
				// inside these elements, the <mark> tags corrupt the source code
				// and cause rendering to fail when switching editors.
				//
				// https://github.com/laurent22/joplin/issues/14142
				if ((node as Element).parentElement?.closest('.joplin-source')) return false;

				return true;
			},
			...extraOptions,
		},
	);
};

const markJsUtils = {
	markKeyword,
};

export default markJsUtils;
