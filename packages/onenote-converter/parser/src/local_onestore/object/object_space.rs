use std::{collections::HashMap};

use crate::{local_onestore::{file_node::{file_node::ObjectSpaceManifestListReferenceFND, FileNodeData}, file_structure::FileNodeDataIterator, object::id_mapping::IdMapping}, shared::{compact_id::CompactId, exguid::ExGuid}};
use parser_utils::{errors::{ErrorKind, Result}, log_warn};

/// A collection of objects, referenced from the root file node list.
///
/// See [\[MS-ONESTORE\] 2.1.4](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/1329433f-02a5-4e83-ab41-80d57ade38d9)
pub struct ObjectSpace {
    id: ExGuid,
}

impl ObjectSpace {
	pub fn try_parse(iterator: &mut FileNodeDataIterator)->Result<Option<Self>> {
		let next = iterator.peek();

		match next {
            Some(FileNodeData::ObjectSpaceManifestListReferenceFND(list_reference)) => {
                iterator.next();
                Ok(Some(Self::parse(iterator, list_reference)?))
            },
            _ => {
                Ok(None)
            },
        }
	}

	fn parse(_iterator: &mut FileNodeDataIterator, list_reference: &ObjectSpaceManifestListReferenceFND) -> Result<Self> {
		let id = list_reference.gosid;

        Ok(Self { id })
	}
}

