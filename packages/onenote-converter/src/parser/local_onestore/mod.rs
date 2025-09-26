use crate::parser::errors::{ErrorKind, Result};
use crate::parser::shared::guid::Guid;
use crate::parser::Reader;
use crate::utils::utils::log;
use data::FileChunkReference64x32;

mod data;

/// A OneNote file packaged in the standard OneNote 2016 format.
///
/// See [\[MS-ONESTORE\] 2.8.1]
///
/// [\[MS-ONESTORE\] 2.8.1]: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/a2f046ea-109a-49c4-912d-dc2888cf0565
/// 
#[derive(Debug)]
pub(crate) struct OneStorePackaging {
    pub file_type: Guid,
    pub file: Guid,
    pub file_format: Guid,
    pub transaction_log_count: u32,
    pub ancestor_guid: Guid,
    pub crc: u32,
    pub fcr_hashed_chunk_list: FileChunkReference64x32,
    pub fcr_transaction_log: FileChunkReference64x32,
    pub fcr_file_node_list_root: FileChunkReference64x32,
    pub fcr_free_chunk_list: FileChunkReference64x32,
}

impl OneStorePackaging {
    pub(crate) fn parse(reader: Reader) -> Result<OneStorePackaging> {
        let file_type = Guid::parse(reader)?;
        let file = Guid::parse(reader)?;
        let legacy_file_version = Guid::parse(reader)?;
        let file_format = Guid::parse(reader)?;

        if file_format != Guid::from_str("109ADD3F-911B-49F5-A5D0-1791EDC8AED8").unwrap() {
            // Matches the file format specified in MS-ONESTORE section 2.3
            return Err(
                ErrorKind::NotFssHttpBData(
                    "This parser only supports OneNote^(r) 2016-style Notebooks.".into()
                ).into(),
            );
        }
        
        // Skip information about reads/writes
        reader.advance(16)?;
        // Skip the legacy free chunk list and transaction log
        reader.advance(16)?;

        let transaction_log_count = reader.get_u32()?;

        // Skip 28 bytes of legacy and placeholder data
        reader.advance(28)?;


        if reader.get_u32()? != 0 {
            return Err(ErrorKind::MalformedFssHttpBData("invalid padding data".into()).into());
        }


        ObjectHeader::try_parse_32(reader, ObjectType::OneNotePackaging)?;

        let storage_index = ExGuid::parse(reader)?;
        let cell_schema = Guid::parse(reader)?;

        let data_element_package = DataElementPackage::parse(reader)?;

        ObjectHeader::try_parse_end_16(reader, ObjectType::OneNotePackaging)?;

        Ok(OneStorePackaging {
            file_type,
            file,
            file_format,
            storage_index,
            cell_schema,
            data_element_package,
        })
    }
}
