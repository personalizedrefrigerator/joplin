import { _ } from '../../../../locale';
import Setting from '../../../../models/Setting';
import shim from '../../../../shim';

interface Props {
	editorMigrationVersion: number;
	markdownEditorEnabled: boolean;
}

const useEditorTypeMigrationBanner = ({ markdownEditorEnabled, editorMigrationVersion }: Props) => {
	const React = shim.react();
	const enabled = markdownEditorEnabled && editorMigrationVersion < 1;

	return React.useMemo(() => {
		const onMigrationComplete = () => {
			Setting.setValue('editor.migration', 1);
		};

		return {
			enabled,
			label: _('Certain Markdown formatting is now rendered in the editor by default. For example, **bold** will appear as actual bold text. You can change this behaviour anytime in Settings under Note > Markdown editor: Render markup in editor. More details are available in the official announcement.'),
			disable: {
				label: _('Disable it'),
				onPress: () => {
					Setting.setValue('editor.inlineRendering', false);
					Setting.setValue('editor.imageRendering', false);
					onMigrationComplete();
				},
			},
			keepEnabled: {
				label: _('Keep it enabled'),
				onPress: async () => {
					onMigrationComplete();
				},
			},
		};
	}, [enabled]);
};

export default useEditorTypeMigrationBanner;
