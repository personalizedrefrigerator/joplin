import { _ } from '@joplin/lib/locale';

// For mobile, **do not reference this file** directly from within
// the editor bundle. Its use of @joplin/lib/locale significantly
// increases bundle size.
//
// Instead, this function should be called when first creating the editor
// and localisations should be provided through the `localisations` option.
//
// See https://codemirror.net/examples/translate/
export default () => ({
	// @codemirror/view
	'Control character': _('Control character'),

	// @codemirror/commands
	'Selection deleted': _('Selection deleted'),

	// @codemirror/search
	'Go to line': _('Go to line'),
	'go': _('go'),
	'Find': _('Find'),
	'Replace': _('Replace'),
	'next': _('next'),
	'previous': _('previous'),
	'all': _('all'),
	'match case': _('match case'),
	'by word': _('by word'),
	'replace': _('replace'),
	'replace all': _('replace all'),
	'close': _('close'),
	'current match': _('current match'),
	'replaced $ matches': _('replaced $ matches'),
	'replaced match on line $': _('replaced match on line $'),
	'on line': _('on line'),

	// Editor announcements
	'Added $ markup': _('Added $ markup'),
	'Removed $ markup': _('Removed $ markup'),
	'Selected changed content': _('Selected changed content'),
	'Converted $1 to $2': _('Converted $1 to $2'),
	'Indent': _('Indent'),
	'Header level $': _('Header level $'),
	'Header': _('Header'),
	'Checklist': _('Checklist'),
	'Numbered list': _('Numbered list'),
	'Bullet list': _('Bullet list'),
	'Inline math': _('Inline math'),
	'Block math': _('Block math'),
	'Added $1 $2 items': _('Added $1 $2 items'),
	'Removed $1 $2 items': _('Removed $1 $2 items'),
	'Replaced $1 items with $2 items': _('Replaced $1 items with $2 items'),
});
