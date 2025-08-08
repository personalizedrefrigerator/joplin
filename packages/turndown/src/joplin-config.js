// The default Turndown options used by Joplin's editor
module.exports = {
	headingStyle: 'atx',
	codeBlockStyle: 'fenced',
	preserveImageTagsWithSize: true,
	preserveNestedTables: true,
	preserveColorStyles: true,
	bulletListMarker: '-',
	emDelimiter: '*',
	strongDelimiter: '**',
	allowResourcePlaceholders: true,
	expandNonbreakingSpaces: true,

	// If soft-breaks are enabled, lines need to end with two or more spaces for
	// trailing <br/>s to render. See
	// https://github.com/laurent22/joplin/issues/8430
	br: '  ',
};
