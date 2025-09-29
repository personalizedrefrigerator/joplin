use crate::parser::Reader;
use crate::parser::errors::{ErrorKind, Result};
use super::file_node_data::{ FileNodeData, FileNodeId };

pub struct FileNodePackage {
	node_id: FileNodeId,
	size: u32,
	stp_format: u32,
	cb_format: u32,
	base_type: u32,
	reserved_1: u32,
	fnd: FileNodeData,
}

impl FileNodePackage {
	pub fn parse(reader: Reader)->Result<Self> {
		let node_id: FileNodeId = reader.get_u32()?;

		let fnd = match node_id {
			FileNodeId::ObjectSpaceManifestRootFND => 3,
		};

	}
}