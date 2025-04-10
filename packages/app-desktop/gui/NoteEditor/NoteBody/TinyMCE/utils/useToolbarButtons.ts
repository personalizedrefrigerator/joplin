import CommandService from '@joplin/lib/services/CommandService';
import { PluginStates, utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import { useEffect, useMemo, useState } from 'react';
import { Editor } from 'tinymce';

interface Props {
	plugins: PluginStates;
	editor: Editor;
}

const useToolbarButtons = ({ plugins, editor }: Props) => {
	const [lastPluginCommandNames, setLastPluginCommandNames] = useState<string[]>([]);
	const toolbar = useMemo(() => {
		const pluginCommandNames: string[] = [];
		const infos = pluginUtils.viewInfosByType(plugins, 'toolbarButton');

		for (const info of infos) {
			const view = info.view;
			if (view.location !== 'editorToolbar') continue;
			pluginCommandNames.push(view.commandName);
		}
		setLastPluginCommandNames(pluginCommandNames);

		const toolbarPluginButtons = pluginCommandNames.length ? ` | ${pluginCommandNames.join(' ')}` : '';

		// The toolbar is going to wrap based on groups of buttons
		// (delimited by |). It means that if we leave large groups of
		// buttons towards the end of the toolbar it's going to needlessly
		// hide many buttons even when there is space. So this is why below,
		// we create small groups of just one button towards the end.

		const toolbar = [
			'bold', 'italic', 'joplinHighlight', 'joplinStrikethrough', '|',
			'joplinInsert', 'joplinSup', 'joplinSub', 'forecolor', '|',
			'link', 'joplinInlineCode', 'joplinCodeBlock', 'joplinAttach', '|',
			'bullist', 'numlist', 'joplinChecklist', '|',
			'h1', 'h2', 'h3', '|',
			'hr', '|',
			'blockquote', '|',
			'tableWithHeader', '|',
			`joplinInsertDateTime${toolbarPluginButtons}`,
		];

		return toolbar.join(' ');
	}, [plugins]);

	useEffect(() => {
		if (editor) {
			console.warn('update toolbar', toolbar);
			editor.options.set('toolbar', toolbar);
		}
	}, [editor, toolbar]);

	useEffect(() => {
		if (!editor) return;

		const existingButtons = editor.ui.registry.getAll().buttons;
		for (const pluginCommandName of lastPluginCommandNames) {
			// Don't re-register commands
			if (pluginCommandName.toLowerCase() in existingButtons) continue;

			const iconClassName = CommandService.instance().iconName(pluginCommandName);

			// Only allow characters that appear in Font Awesome class names: letters, spaces, and dashes.
			const safeIconClassName = iconClassName.replace(/[^a-z0-9 -]/g, '');

			editor.ui.registry.addIcon(pluginCommandName, `<i class="plugin-icon ${safeIconClassName}"></i>`);
			editor.ui.registry.addButton(pluginCommandName, {
				tooltip: CommandService.instance().label(pluginCommandName),
				icon: pluginCommandName,
				onAction: function() {
					void CommandService.instance().execute(pluginCommandName);
				},
			});
		}
	}, [editor, lastPluginCommandNames]);

	return toolbar;
};

export default useToolbarButtons;
