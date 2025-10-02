use crate::{local_onestore::{file_node::{file_node::ObjectSpaceManifestListReferenceFND, FileNodeData}, file_structure::FileNodeDataIterator, objects::{revision_manifest_list::RevisionManifestList}}, shared::{compact_id::CompactId, exguid::ExGuid}};
use parser_utils::{errors::{ErrorKind, Result}};

/// A collection of objects, referenced from the root file node list.
///
/// See [\[MS-ONESTORE\] 2.1.4](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/1329433f-02a5-4e83-ab41-80d57ade38d9)
pub struct ObjectSpace {
    id: ExGuid,
    revision_list: RevisionManifestList,
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
        let mut list_iterator = list_reference.last_revision.list.iter_data();
        let revision_list = RevisionManifestList::try_parse(&mut list_iterator)?;
        Ok(Self {
            id,
            revision_list: revision_list.ok_or_else(
                || ErrorKind::MalformedOneStoreData("ObjectSpace should point to a RevisionManifestList".into())
            )?
        })
	}
}

