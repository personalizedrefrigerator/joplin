
// Used in safe mode

import * as React from 'react';
import { ForwardedRef } from 'react';
import { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { NoteBodyEditorProps, NoteBodyEditorRef } from '../../utils/types';

const PlainEditor = (props: NoteBodyEditorProps, ref: ForwardedRef<NoteBodyEditorRef>) => {
	const editorRef = useRef<HTMLTextAreaElement|null>(null);

	useImperativeHandle(ref, () => {
		return {
			content: () => editorRef.current?.value ?? '',
			resetScroll: () => {
				editorRef.current.scrollTop = 0;
			},
			scrollTo: () => {
				// Not supported
			},

			supportsCommand: _name => {
				return false;
			},
			execCommand: async _command => {
				// Not supported
			},
		};
	}, []);

	useEffect(() => {
		if (!editorRef.current) return;

		if (editorRef.current.value !== props.content) {
			editorRef.current.value = props.content;
		}
	}, [props.content]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	const onChange = useCallback((event: any) => {
		props.onChange({ changeId: null, content: event.target.value });
	}, [props.onChange]);

	return (
		<div style={props.style}>
			<textarea
				ref={editorRef}
				style={{ width: '100%', height: '100%' }}
				defaultValue={props.content}
				onChange={onChange}
			/>
		</div>
	);
};

export default forwardRef(PlainEditor);

