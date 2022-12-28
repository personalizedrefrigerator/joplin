
import { EditorView, ViewPlugin } from '@codemirror/view';

const editorZoomExtension = ViewPlugin.fromClass(class {
	private target: HTMLElement;
	private gestureStartTouchDistance: number = 0;
	private initialTextScale: number = 1;
	private currentTextScale: number = 1;

	public constructor(private editorView: EditorView) {
		this.target = editorView.dom;

		this.target.addEventListener('touchstart', this.handleTouchStart);
		this.target.addEventListener('touchmove', this.handleTouchMove);
		this.target.addEventListener('touchend', this.handleTouchEnd);
		this.target.addEventListener('wheel', this.handleMouseWheel);
	}

	private updateTextScale(scale: number) {
		const minScale = 0.1;
		const maxScale = 10;

		scale = Math.min(scale, maxScale);
		scale = Math.max(scale, minScale);


		this.currentTextScale = scale;

		// Scrolling can be slow -- round the scale to prevent
		// updating with every touch update.
		const roundedScale = Math.round(scale * 20) / 20;
		const newScaleStyle = `${roundedScale}em`;

		if (this.target.style.fontSize !== newScaleStyle) {
			this.target.style.fontSize = newScaleStyle;

			this.editorView.dispatch(this.editorView.state.update({
				scrollIntoView: true,
			}));
		}
	}

	private computeTouchDistance(touchA: Touch, touchB: Touch): number {
		return Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
	}

	private handleTouchStart = (evt: TouchEvent) => {
		if (evt.touches.length !== 2) {
			return;
		}

		this.gestureStartTouchDistance = this.computeTouchDistance(evt.touches[0], evt.touches[1]);
		this.initialTextScale = this.currentTextScale;
		evt.preventDefault();
	};

	private handleTouchMove = (evt: TouchEvent) => {
		if (evt.touches.length !== 2) {
			return;
		}

		const currentDistance = this.computeTouchDistance(evt.touches[0], evt.touches[1]);
		const distanceScale = currentDistance / this.gestureStartTouchDistance;

		// Work around the case where gestureStartDistance is 0.
		if (isFinite(distanceScale)) {
			this.updateTextScale(distanceScale * this.initialTextScale);

			// Prevent the touches from being interpreted as other gestures by the browser
			evt.preventDefault();
		}
	};

	private handleTouchEnd = (evt: TouchEvent) => {
		this.handleTouchMove(evt);
	};

	private handleMouseWheel = (evt: WheelEvent) => {
		if (evt.ctrlKey) {
			let multiplier = 1.01;

			if (evt.deltaMode === WheelEvent.DOM_DELTA_LINE) {
				multiplier = 1.08;
			} else if (evt.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
				multiplier *= 1.4;
			}

			this.updateTextScale(this.currentTextScale * Math.pow(multiplier, -evt.deltaY));
			evt.preventDefault();
		}
	};

	public destroy() {
		this.target.removeEventListener('touchstart', this.handleTouchStart);
		this.target.removeEventListener('touchmove', this.handleTouchMove);
		this.target.removeEventListener('touchend', this.handleTouchEnd);
		this.target.removeEventListener('wheel', this.handleMouseWheel);
	}
});

export default editorZoomExtension;
