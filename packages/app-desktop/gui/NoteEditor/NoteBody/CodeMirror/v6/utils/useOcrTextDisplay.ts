import CodeMirrorControl from '@joplin/editor/CodeMirror/CodeMirrorControl';
import { ResourceInfos } from '../../../../utils/types';
import { useEffect } from 'react';

const useOcrTextDisplay = (editor: CodeMirrorControl, resourceInfos: ResourceInfos) => {
	useEffect(() => {
		editor?.setImageDescriptions(Object.values(resourceInfos).map(info => {
			return {
				id: info.item.id as string,
				description: info.item.ocr_text ?? '',
			};
		}).filter(item => !!item.description));
	}, [editor, resourceInfos]);
};

export default useOcrTextDisplay;

