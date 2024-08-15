import sqlStringToLines from '../sqlStringToLines';
import { SqlQuery } from '../types';

export default (): (SqlQuery|string)[] => {
	const result = [];
	result.push(...sqlStringToLines(`
		CREATE TABLE folder_mirror_journal (
			mirror_id INTEGER NOT NULL,
			path TEXT NOT NULL,
			item_id TEXT NOT NULL,
			hash_md5 TEXT NOT NULL
		);
	`));
	return result;
};
