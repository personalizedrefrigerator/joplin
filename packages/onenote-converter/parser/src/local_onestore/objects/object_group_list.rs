use crate::{
    local_onestore::{
        file_node::{file_node::ObjectGroupListReferenceFND, FileNodeData},
        file_structure::FileNodeDataIterator,
        objects::{global_id_table::GlobalIdTable, object::Object},
    },
    shared::exguid::ExGuid,
};
use parser_utils::{errors::Result, log_warn};

/// See [MS-ONESTORE 2.1.13](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/607a84d4-5762-4a3e-9244-c91acddcf647)
#[derive(Debug)]
pub struct ObjectGroupList {
    id: ExGuid,
    id_table: GlobalIdTable,
    objects: Vec<Object>,
}

impl ObjectGroupList {
    pub fn try_parse(iterator: &mut FileNodeDataIterator) -> Result<Option<Self>> {
        let current = iterator.peek();
        if let Some(FileNodeData::ObjectGroupListReferenceFND(data)) = current {
            iterator.next();
            Ok(Some(Self::from_reference(iterator, data)?))
        } else if let Some(FileNodeData::ObjectGroupStartFND(_)) = current {
            Ok(Some(Self::parse(iterator)?))
        } else {
            Ok(None)
        }
    }

    fn from_reference(
        iterator: &mut FileNodeDataIterator,
        reference: &ObjectGroupListReferenceFND,
    ) -> Result<Self> {
        let mut iterator = reference.list.iter_data();
        Self::parse(&mut iterator)
    }

    fn parse(iterator: &mut FileNodeDataIterator) -> Result<Self> {
        let start = match iterator.next() {
            Some(FileNodeData::ObjectGroupStartFND(object)) => object,
            _ => {
                return Err(onestore_parse_error!(
                    "Object group lists must start with an ObjectGroupStartFND node."
                )
                .into());
            }
        };
        let id = start.oid;
        let id_table = GlobalIdTable::try_parse(iterator)?
            .ok_or_else(|| onestore_parse_error!("Global ID table not found in ObjectGroupList"))?;
        let mut objects = Vec::new();

        let mut last_index = iterator.get_index();
        while let Some(item) = iterator.peek() {
            if matches!(item, FileNodeData::ObjectGroupEndFND) {
                break;
            } else if let FileNodeData::DataSignatureGroupDefinitionFND(_) = item {
                iterator.next();
                log_warn!("Ignoring DataSignatureGroupDefinitionFND"); // TODO
            } else if let Some(object) = Object::try_parse(iterator)? {
                objects.push(object);
            } else {
                return Err(onestore_parse_error!(
                    "Unexpected node in ObjectGroupList: {:?}",
                    item
                )
                .into());
            }

            let index = iterator.get_index();
            assert_ne!(index, last_index);
            last_index = index;
        }

        Ok(Self {
            id,
            id_table,
            objects,
        })
    }
}
