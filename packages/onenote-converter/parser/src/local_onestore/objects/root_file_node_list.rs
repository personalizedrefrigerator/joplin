use super::file_data_store::FileDataStore;
use crate::{
    local_onestore::{
        file_node::FileNodeData, file_structure::FileNodeDataIterator,
        objects::object_space::ObjectSpace,
    },
    shared::exguid::ExGuid,
};
use parser_utils::errors::Result;

// TODO: See
// - https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/28e21c1f-94b6-4f98-9d81-2e1278ebefc6
// - https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/e3f4f871-f674-4198-9cb8-d67e1eeac2f3
#[derive(Debug)]
pub struct RootFileNodeList {
    pub root_object_space_id: ExGuid,
    pub object_spaces: Vec<ObjectSpace>,
    pub file_data_store: Option<FileDataStore>,
}

impl RootFileNodeList {
    pub fn parse(iterator: &mut FileNodeDataIterator) -> Result<Self> {
        let mut object_spaces = Vec::new();
        let mut file_data_store = None;
        let mut root_object_space_id = None;

        let mut last_index: usize = iterator.get_index();
        while let Some(current) = iterator.peek() {
            if let Some(object_space) = ObjectSpace::try_parse(iterator)? {
                object_spaces.push(object_space);
            } else if let Some(data_store) = FileDataStore::try_parse(iterator)? {
                if file_data_store.is_some() {
                    return Err(onestore_parse_error!(
                        "Only one file_data_store can exist in the root node list"
                    )
                    .into());
                }
                file_data_store = Some(data_store);
            } else if let FileNodeData::ObjectSpaceManifestRootFND(data) = current {
                iterator.next();
                root_object_space_id = Some(data.gosid_root);
            } else {
                return Err(onestore_parse_error!(
                    "Unexpected entry in the root file node list: {:?}",
                    current
                )
                .into());
            }

            let index = iterator.get_index();
            if index == last_index {
                println!(
                    "Indexes equal: {} = {}. Parsing: {:?}",
                    index, index, current
                )
            }
            assert_ne!(index, last_index);
            last_index = index;
        }

        Ok(Self {
            root_object_space_id: root_object_space_id.ok_or_else(|| {
                onestore_parse_error!("Root file node list did not contain a node with the root ID")
            })?,
            file_data_store,
            object_spaces,
        })
    }
}
