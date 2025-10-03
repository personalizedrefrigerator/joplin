use std::collections::HashMap;

use crate::{
    local_onestore::{
        file_node::{file_node::RevisionManifestListStartFND, FileNodeData},
        file_structure::FileNodeDataIterator,
        objects::revision::Revision,
    },
    shared::exguid::ExGuid,
};
use parser_utils::errors::{ErrorKind, Result};

#[derive(Debug)]
pub struct RevisionManifestList {
    revisions: HashMap<ExGuid, Revision>,
}

impl RevisionManifestList {
    pub fn try_parse(iterator: &mut FileNodeDataIterator) -> Result<Option<Self>> {
        let next = iterator.peek();

        match next {
            Some(FileNodeData::RevisionManifestListStartFND(list_reference)) => {
                iterator.next();
                Ok(Some(Self::parse(iterator, list_reference)?))
            }
            _ => Ok(None),
        }
    }

    fn parse(
        iterator: &mut FileNodeDataIterator,
        _list_reference: &RevisionManifestListStartFND,
    ) -> Result<Self> {
        let mut revisions: HashMap<ExGuid, _> = HashMap::new();

        let mut last_index = iterator.get_index();
        while let Some(current) = iterator.peek() {
            match current {
                FileNodeData::RevisionManifestEndFND => {
                    break;
                }
                FileNodeData::RevisionRoleDeclarationFND(_data) => {
                    // Ignore. If present, should always have revision_role = 0x1?
                    iterator.next();
                }
                FileNodeData::RevisionRoleAndContextDeclarationFND(data) => {
                    // Adds an additional (revision role, context) pair to some prior revision
                    // in the list.
                    // See [MS-ONESTORE 2.5.18](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/4863b0e8-fe14-49bb-a634-558c747bf0b8).
                    let revision = revisions.get(&data.base.rid);
                    if let Some(_revision) = revision {
                        iterator.next();
                        todo!("apply the new role and context to the revision");
                    } else {
                        return Err(
                            ErrorKind::MalformedOneStoreData("RevisionRoleAndContextDeclarationFND points to a non-existent revision".into()).into()
                        );
                    }
                }
                node => {
                    let revision = Revision::try_parse(iterator)?.ok_or_else(|| {
                        onestore_parse_error!(
                            "Unexpected node encountered in RevisionManifestList: {:?}",
                            node
                        )
                    })?;
                    revisions.insert(revision.id, revision);
                }
            }

            let index = iterator.get_index();
            assert_ne!(index, last_index);
            last_index = index;
        }
        Ok(RevisionManifestList { revisions })
    }
}
