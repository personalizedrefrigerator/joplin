mod common;
mod file_node;
mod file_structure;
mod one_store_file;

use std::collections::HashMap;

use one_store_file::OneStoreFile;
use parser_utils::parse::Parse;

use crate::shared::{compact_id::CompactId, exguid::ExGuid};

pub struct WorldId(u32);

pub struct OneStore {
	raw: OneStoreFile,
	global_id_table: HashMap<(WorldId, CompactId), ExGuid>,
}

impl OneStore {
	fn new(raw: OneStoreFile) -> Self {
		let global_id_table = HashMap::new();


		OneStore {
			raw,
			global_id_table
		}
	}

	pub fn resolve_id(&self, compact_id: CompactId) -> Option<&[u8]> {

	}
}

impl Parse for OneStore {
	fn parse(reader: parser_utils::Reader) -> parser_utils::Result<Self> {
		Ok(Self::new(OneStoreFile::parse(reader)?))
	}
}
