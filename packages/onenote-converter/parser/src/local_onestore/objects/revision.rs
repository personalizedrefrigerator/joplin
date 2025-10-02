use std::collections::HashMap;

use parser_utils::errors::{ErrorKind, Result};
use crate::{local_onestore::{file_node::FileNodeData, file_structure::FileNodeDataIterator, objects::global_id_table::GlobalIdTable}, shared::exguid::ExGuid};
use super::object_group_list::ObjectGroupList;

/// See [MS-ONESTORE 2.1.9](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/90101e91-2f7f-4753-9332-31bed5b5c49d)
pub struct Revision {
    pub id: ExGuid,
    parent_id: ExGuid,
    object_groups: Vec<ObjectGroupList>,
    global_id_tables: Vec<GlobalIdTable>,
    root_objects: HashMap<u32, ExGuid>,
}

impl Revision {
    pub fn try_parse(iterator: &mut FileNodeDataIterator) -> Result<Option<Self>> {
        let next = iterator.peek();

        match next {
            Some(
                FileNodeData::RevisionManifestStart4FND(_)|FileNodeData::RevisionManifestStart6FND(_)
                |FileNodeData::RevisionManifestStart7FND(_)
            ) => {
                Ok(Some(Self::parse(iterator)?))
            },
            _ => Ok(None),
        }
    }

    fn parse(iterator: &mut FileNodeDataIterator) -> Result<Self> {
        let start = iterator.next();
        let (id, parent_id) = match start {
            Some(FileNodeData::RevisionManifestStart4FND(data)) => {
                (data.rid, data.rid_dependent)
            },
            Some(FileNodeData::RevisionManifestStart6FND(data)) => {
                (data.rid, data.rid_dependent)
            },
            Some(FileNodeData::RevisionManifestStart7FND(data)) => {
                (data.base.rid, data.base.rid_dependent)
            },
            _ => {
                return Err(
                    parser_error!(MalformedOneStoreData, "Invalid start node for revision: {:?}", start).into(),
                );
            },
        };

        let mut object_groups = Vec::new();
        let mut global_id_tables = Vec::new();
        let mut root_objects = HashMap::new();

        while let Some(current) = iterator.peek() {
            if let Some(object_group_list) = ObjectGroupList::try_parse(iterator)? {
                // Ignore the "info dependency overrides" section
                // TODO: Move this into the "ObjectGroupList" parsing logic.
                let dependency_overrides = iterator.next();
                if !matches!(dependency_overrides, Some(FileNodeData::ObjectInfoDependencyOverridesFND(_))) {
                    return Err(ErrorKind::MalformedOneStoreData("Object group lists must always be followed by ObjectInfoDependencyOverridesFND nodes.".into()).into());
                }
                object_groups.push(object_group_list);
            } else if let Some(global_id_table) = GlobalIdTable::try_parse(iterator)? {
                global_id_tables.push(global_id_table);
            } else if let FileNodeData::RootObjectReference3FND(object_reference) = current {
                iterator.next(); // Consume the reference
                root_objects.insert(object_reference.root_role, object_reference.oid_root);
            } else {
                return Err(
                    parser_error!(MalformedOneStoreData, "Unexpected node: {:?}", current).into()
                );
            }
        }

        Ok(Revision { id, parent_id, object_groups, global_id_tables, root_objects })
    }
}
