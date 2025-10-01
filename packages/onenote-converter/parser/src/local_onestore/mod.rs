use file_structure::FileNodeListFragment;
use file_structure::{FreeChunkListFragment, OneStoreHeader, TransactionLogFragment};
use parser_utils::errors::Result;
use parser_utils::parse::Parse;
use parser_utils::Reader;

use crate::local_onestore::{common::FileChunkReference, file_structure::RootFileNodeList};

mod common;
mod file_node;
mod file_structure;

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
    pub root_file_node_list: Option<RootFileNodeList>,
}

impl OneStorePackaging {
    pub fn parse(reader: Reader) -> Result<Self> {
        let header = OneStoreHeader::parse(reader)?;

        let mut free_chunk_list = Vec::new();
        let mut free_chunk_ref = header.fcr_free_chunk_list.clone();
        while !free_chunk_ref.is_fcr_nil() && !free_chunk_ref.is_fcr_zero() {
            let mut reader = reader.with_start_index(free_chunk_ref.stp as usize)?;
            let fragment = FreeChunkListFragment::parse(&mut reader, free_chunk_ref.cb.into())?;
            free_chunk_ref = fragment.fcr_next_chunk.clone();
            free_chunk_list.push(fragment);
        }

        let mut transaction_log = Vec::new();
        let mut transaction_log_ref = header.fcr_transaction_log.clone();
        loop {
            let mut reader = reader.with_start_index(transaction_log_ref.stp as usize)?;

            let fragment = TransactionLogFragment::parse(&mut reader, transaction_log_ref.cb as usize)?;
            transaction_log_ref = fragment.next_fragment.clone();
            transaction_log.push(fragment);

            if transaction_log_ref.is_fcr_nil() || transaction_log_ref.is_fcr_zero() {
                break;
            }
        }

        let mut hashed_chunk_list = Vec::new();
        let mut hash_chunk_ref = header.fcr_hashed_chunk_list.clone();
        while !hash_chunk_ref.is_fcr_nil() && !hash_chunk_ref.is_fcr_zero() {
            let mut reader = reader.with_start_index(hash_chunk_ref.stp as usize)?;
            let fragment = FileNodeListFragment::parse(&mut reader, hash_chunk_ref.cb as usize)?;
            hash_chunk_ref = fragment.next_fragment.clone();
            hashed_chunk_list.push(fragment);
        }

        let file_node_list_root = &header.fcr_file_node_list_root;
        let root_file_node_list =
            if !file_node_list_root.is_fcr_nil() && !file_node_list_root.is_fcr_zero() {
                let mut reader = reader.with_start_index(file_node_list_root.stp as usize)?;
                Some(RootFileNodeList::parse(
                    &mut reader,
                    file_node_list_root.cb as usize,
                )?)
            } else {
                None
            };

        Ok(Self {
            header,
            free_chunk_list,
            transaction_log,
            hashed_chunk_list,
            root_file_node_list,
        })
    }
}

#[cfg(test)]
mod test {
    use parser_utils::fs_driver;
    use parser_utils::reader::Reader;

    use super::OneStorePackaging;

    #[test]
    fn should_parse_onenote_2016_file() {
        // TODO: Update path:
        let test_data = fs_driver().read_file("/home/self/Documents/test/test.one").unwrap();
        let mut reader = Reader::new(&test_data);
        let packaging = OneStorePackaging::parse(&mut reader).unwrap();
        println!("Packaging {:#?}", packaging);
        assert!(packaging.root_file_node_list.is_some());
    }
}