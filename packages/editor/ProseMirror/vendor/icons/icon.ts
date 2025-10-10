import { Icon } from "./types";

type ImportedIcon = { default: Icon };

const icon = (importedIcon: ImportedIcon): Icon => {
	return () => {
		const icon = importedIcon.default();
		icon.removeAttribute('fill');
		icon.style.fill = 'currentColor';
		return icon;
	};
};

export default icon;