import createTestEditor from '../testing/createTestEditor';
import detailsPlugin from './detailsPlugin';
import originalMarkupPlugin from './originalMarkupPlugin';

describe('detailsPlugin', () => {
	it('should add jop-noMdConv attributes to <details> and <summary>', () => {
		const serializer = new XMLSerializer();
		const markupToHtml = originalMarkupPlugin(node => serializer.serializeToString(node));
		const view = createTestEditor({
			html: `
				<details><summary>Test</summary>
					<p>Test...</p>
				</details>
			`,
			plugins: [detailsPlugin, markupToHtml.plugin],
		});

		// Serialize, then parse to normalize the HTML (for comparison
		// with the HTML serialized by markupToHtml).
		const expectedState = serializer.serializeToString(
			new DOMParser().parseFromString([
				'<details class="jop-noMdConv"><summary class="jop-noMdConv">Test</summary>',
				'<p>Test...</p>',
				'</details>',
			].join(''), 'text/html').querySelector('details'),
		);

		expect(
			markupToHtml.stateToMarkup(view.state).trim(),
		).toBe(expectedState);
	});
});
