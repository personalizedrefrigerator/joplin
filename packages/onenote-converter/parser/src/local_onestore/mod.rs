mod common;
mod file_node;
mod file_structure;
mod one_store_file;
mod global_id_table;
mod object;

use std::collections::HashMap;

use one_store_file::OneStoreFile;
use parser_utils::parse::Parse;

use crate::{local_onestore::file_node::NodeId, shared::{compact_id::CompactId, exguid::ExGuid, guid::Guid}};

// Maps from guid_index -> 
type IdTable = HashMap<u32, Guid>;

pub struct OneStore {
	raw: OneStoreFile,
	node_to_id_table: HashMap<NodeId, IdTable>,
}

impl OneStore {
	fn new(raw: OneStoreFile) -> Self {
		// Do higher-level parsing: Convert the low-level objects to high-level ones
		


		OneStore {
			raw,
			node_to_id_table
		}
	}

	pub fn resolve_id(&self, compact_id: CompactId) -> Option<&[u8]> {
		None
	}
}

impl Parse for OneStore {
	fn parse(reader: parser_utils::Reader) -> parser_utils::Result<Self> {
		Ok(Self::new(OneStoreFile::parse(reader)?))
	}
}
