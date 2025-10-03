use crate::{
    local_onestore::{
        file_node::{
            file_node::{FileData, FileDataStoreListReferenceFND},
            FileNodeData,
        },
        file_structure::FileNodeDataIterator,
    },
    shared::guid::Guid,
};
use parser_utils::errors::Result;

/// See [MS-ONESTORE 2.5.21](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/2701cc42-3601-49f9-a3ba-7c40cd8a2be9)
#[derive(Debug)]
pub struct FileDataStore {
    pub files: Vec<File>,
}

#[derive(Debug)]
pub struct File {
    id: Guid,
    pub file_data: FileData,
}

impl FileDataStore {
    pub fn try_parse(iterator: &mut FileNodeDataIterator) -> Result<Option<Self>> {
        if let Some(FileNodeData::FileDataStoreListReferenceFND(data)) = iterator.peek() {
            iterator.next();
            Ok(Some(Self::from_reference(data)?))
        } else {
            Ok(None)
        }
    }

    fn from_reference(reference: &FileDataStoreListReferenceFND) -> Result<Self> {
        let iterator = reference.list.iter_data();
        let mut files = Vec::new();
        for item in iterator {
            if let FileNodeData::FileDataStoreObjectReferenceFND(item) = item {
                files.push(File {
                    id: item.guid,
                    file_data: item.target.file_data.clone(),
                })
            } else {
                return Err(onestore_parse_error!(
                    "Unexpected item in file list: {:?}. Expected FileDataStoreObjectReferenceFND",
                    item
                )
                .into());
            }
        }

        Ok(Self { files })
    }
}
