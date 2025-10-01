use std::{collections::HashMap};

use crate::{local_onestore::{file_node::NodeId, file_structure::RootFileNodeList}, shared::{compact_id::CompactId, exguid::ExGuid, guid::Guid}};
use parser_utils::errors::{ErrorKind, Result};

pub struct GlobalIdTable<'a> {
	node_to_mapping: HashMap<NodeId, &'a IdMapping>,
}

impl <'a> GlobalIdTable<'a> {
	pub fn build(root_node_list: RootFileNodeList) {
		let node_to_id_table = raw.root_file_node_list.iter().flat_map(
			|list| {
				let mut id_table = None;
				let mut node_to_id_table = Vec::new();
				let mut current_mapping =  
				for node in list.iter_recursive() {
					if let 
				}
			}
		).collect();
	}

	pub fn resolve_id(&self, id: &CompactId, source: &NodeId) -> Result<ExGuid> {
		let mapping = self.node_to_mapping.get(source).ok_or(
			ErrorKind::ResolutionFailed(format!("Node {:?} missing from map", source).into())
		)?;
		mapping.resolve_id(id)
	}
}

/// A subset of the global ID table that applies to a particular range of nodes.
/// Maps from GUID index -> GUID. The other part of the full ID is stored directly
/// in each CompactId.
struct IdMapping(HashMap<u32, Guid>);

impl IdMapping {
	fn resolve_id(&self, id: &CompactId) -> Result<ExGuid> {
		let guid = self.0.get(
			&id.guid_index
		).ok_or(ErrorKind::ResolutionFailed("Missing mapping for ID.".into()))?;

		Ok(ExGuid::from_guid(guid.clone(), id.n.into()))
	}
}

