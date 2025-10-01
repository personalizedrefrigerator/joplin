mod common;
mod file_node;
mod file_structure;
mod one_store_file;
mod global_id_table;

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
		let node_to_id_table = raw.root_file_node_list.iter().flat_map(
			|list| {
				let mut id_table = None;
				let mut node_to_id_table = Vec::new();
				let mut global_id_table_builder 
				for node in list.iter_recursive() {
					if let 
				}
			}
		).collect();

		if let Some(node_list) = raw.root_file_node_list {
			for node in node_list.iter_recursive() {
				node_to_id_table.node.node_unique_id
			}
		}


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
