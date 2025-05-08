import * as React from 'react';
import { ProcessResultsRow } from '@joplin/lib/services/search/SearchEngine';
import { ModelType } from '@joplin/lib/BaseModel';
import { useCallback } from 'react';
import { _n } from '@joplin/lib/locale';

export type OnBannerResourceClick = (searchResult: ProcessResultsRow)=> void;

interface Props {
	searchResults: ProcessResultsRow[];
	noteId: string;
	onResourceLinkClick: OnBannerResourceClick;
}

interface ResourceResultProps {
	result: ProcessResultsRow;
	onResourceClick: OnBannerResourceClick;
}

const ResourceResult: React.FC<ResourceResultProps> = ({ result, onResourceClick }) => {
	const onClick = useCallback(() => {
		onResourceClick(result);
	}, [result, onResourceClick]);

	return <button
		onClick={onClick}
		className='link-button'
		role='link'
	>{result.title}</button>;
};

const ResourceSearchResultsBanner: React.FC<Props> = ({
	searchResults,
	onResourceLinkClick,
	noteId,
}) => {
	const resourceResults = searchResults.filter(r => r.id === noteId && r.item_type === ModelType.Resource);

	const renderResource = (resource: ProcessResultsRow) => {
		return <li key={resource.item_id}>
			<ResourceResult result={resource} onResourceClick={onResourceLinkClick}/>
		</li>;
	};

	return (
		<details className={`resource-search-results-banner ${resourceResults.length ? '-visible' : ''}`} open>
			<summary>
				<div className='marker' aria-hidden/>
				{_n('The following attachment matches your search query:', 'The following attachments match your search query:', resourceResults.length)}
			</summary>
			<ul>
				{resourceResults.map(r => renderResource(r))}
			</ul>
		</details>
	);
};

export default ResourceSearchResultsBanner;
