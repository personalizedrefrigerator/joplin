use crate::parser::errors::Result;
use crate::parser::Reader;
use file_structure::{OneStoreHeader, FreeChunkListFragment, TransactionLogFragment};

mod common;
mod file_node_list;
mod file_structure;
mod file_node;

/// A OneNote file packaged in the standard OneNote 2016 format.
///
/// See [\[MS-ONESTORE\] 2.8.1]
///
/// [\[MS-ONESTORE\] 2.8.1]: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/a2f046ea-109a-49c4-912d-dc2888cf0565
/// 
#[derive(Debug)]
pub struct OneStorePackaging {
    pub header: OneStoreHeader,
    pub free_chunk_list: Vec<FreeChunkListFragment>,
    pub transaction_log: Vec<TransactionLogFragment>,
    pub hashed_chunk_list: Vec<FileNodeListFragment>,
    pub root_file_node_list: Vec<RootFileNodeList>,
}

impl OneStorePackaging {
    pub fn parse(reader: Reader) -> Result<Self> {
        let header = OneStoreHeader::parse(reader)?;

        Ok(Self {
            header,
        })
    }
}
