use std::{
    collections::HashMap,
    convert::{TryFrom, TryInto},
};

use super::object_group_list::ObjectGroupList;
use crate::{
    local_onestore::{
        file_node::FileNodeData,
        file_structure::FileNodeDataIterator,
        objects::{global_id_table::GlobalIdTable, parse_context::ParseContext},
    },
    shared::exguid::ExGuid,
};
use parser_utils::errors::{Error, Result};

/// See [MS-ONESTORE 2.1.9](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/90101e91-2f7f-4753-9332-31bed5b5c49d)
#[derive(Debug)]
pub struct Revision {
    pub id: ExGuid,
    _parent_id: ExGuid,
    pub object_groups: Vec<ObjectGroupList>,
    pub global_id_tables: Vec<GlobalIdTable>,
    root_objects: HashMap<RootRole, ExGuid>,
}

#[derive(Eq, PartialEq, Hash, Debug)]
pub enum RootRole {
    DefaultContent,
    MetadataRoot,
    VersionMetadataRoot,
}

impl TryFrom<u32> for RootRole {
    type Error = Error;
    fn try_from(value: u32) -> std::result::Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::DefaultContent),
            2 => Ok(Self::MetadataRoot),
            4 => Ok(Self::VersionMetadataRoot),
            other => Err(onestore_parse_error!("Invalid root role: {}", other).into()),
        }
    }
}

impl Revision {
    pub fn try_parse(
        iterator: &mut FileNodeDataIterator,
        context: &ParseContext,
    ) -> Result<Option<Self>> {
        let next = iterator.peek();

        match next {
            Some(
                FileNodeData::RevisionManifestStart4FND(_)
                | FileNodeData::RevisionManifestStart6FND(_)
                | FileNodeData::RevisionManifestStart7FND(_),
            ) => Ok(Some(Self::parse(iterator, context)?)),
            _ => Ok(None),
        }
    }

    pub fn content_root(&self) -> Option<ExGuid> {
        self.root_objects
            .get(&RootRole::DefaultContent)
            .map(|guid| *guid)
    }

    pub fn metadata_root(&self) -> Option<ExGuid> {
        self.root_objects
            .get(&RootRole::MetadataRoot)
            .map(|guid| *guid)
    }

    fn parse(iterator: &mut FileNodeDataIterator, context: &ParseContext) -> Result<Self> {
        let start = iterator.next();
        let (id, parent_id) = match start {
            Some(FileNodeData::RevisionManifestStart4FND(data)) => (data.rid, data.rid_dependent),
            Some(FileNodeData::RevisionManifestStart6FND(data)) => (data.rid, data.rid_dependent),
            Some(FileNodeData::RevisionManifestStart7FND(data)) => {
                (data.base.rid, data.base.rid_dependent)
            }
            _ => {
                return Err(
                    onestore_parse_error!("Invalid start node for revision: {:?}", start).into(),
                );
            }
        };

        let mut object_groups = Vec::new();
        let mut global_id_tables = Vec::new();
        let mut root_objects: HashMap<RootRole, ExGuid> = HashMap::new();

        while let Some(current) = iterator.peek() {
            if let FileNodeData::RevisionManifestEndFND = current {
                break;
            } else if let Some(object_group_list) = ObjectGroupList::try_parse(iterator, context)? {
                // Ignore the "info dependency overrides" section
                // TODO: Move this into the "ObjectGroupList" parsing logic.
                let dependency_overrides = iterator.next();
                if !matches!(
                    dependency_overrides,
                    Some(FileNodeData::ObjectInfoDependencyOverridesFND(_))
                ) {
                    return Err(
                        onestore_parse_error!("Object group lists must always be followed by ObjectInfoDependencyOverridesFND nodes. Was: {:?}", dependency_overrides).into()
                    );
                }
                object_groups.push(object_group_list);
            } else if let Some(global_id_table) = GlobalIdTable::try_parse(iterator)? {
                global_id_tables.push(global_id_table);
            } else if let FileNodeData::RootObjectReference3FND(object_reference) = current {
                iterator.next(); // Consume the reference
                root_objects.insert(
                    object_reference.root_role.try_into()?,
                    object_reference.oid_root,
                );
            } else {
                return Err(parser_error!(
                    MalformedOneStoreData,
                    "Unexpected node (parsing Revision): {:?}",
                    current
                )
                .into());
            }
        }

        Ok(Revision {
            id,
            _parent_id: parent_id,
            object_groups,
            global_id_tables,
            root_objects,
        })
    }
}
