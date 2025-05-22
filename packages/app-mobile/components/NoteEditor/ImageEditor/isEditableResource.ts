
const isEditableResource = (resourceMime: string) => {
	return resourceMime === 'image/svg+xml' || resourceMime === 'image/png';
};

export default isEditableResource;
