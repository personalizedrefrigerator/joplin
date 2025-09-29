use crate::parser::errors::{ErrorKind, Result};
use crate::parser::shared::guid::Guid;
use crate::parser::Reader;
use super::super::common::{
    FileChunkReference64x32,
    FileChunkReference32
};

/// A OneNote file header in the standard OneNote 2016 format.
///
/// See [\[MS-ONESTORE\] 2.8.1]
///
/// [\[MS-ONESTORE\] 2.8.1]: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/a2f046ea-109a-49c4-912d-dc2888cf0565
/// 
#[derive(Debug)]
pub struct OneStoreHeader {
    pub file_type: Guid,
    pub guid_file: Guid,
    pub legacy_file_version: Guid,
    pub file_format: Guid,
    pub ffv_last_code_that_wrote_to_this_file: u32,
    pub ffv_oldest_code_that_has_written_to_this_file: u32,
    pub ffv_newest_code_that_has_written_to_this_file: u32,
    pub ffv_oldest_code_that_may_read_this_file: u32,
    pub fcr_legacy_free_chunk_list: FileChunkReference32,
    pub fcr_legacy_transaction_log: FileChunkReference32,
    pub c_transactions_in_log: u32,
    pub cb_legacy_expected_file_length: u32,
    pub rgb_placeholder: u64,
    pub fcr_legacy_file_node_list_root: FileChunkReference32,
    pub cb_legacy_free_space_in_free_chunk_list: u32,
    pub f_needs_defrag: u8,
    pub f_repaired_file: u8,
    pub f_needs_garbage_collect: u8,
    pub f_has_no_embedded_file_objects: u8,
    pub guid_ancestor: Guid,
    pub crc_name: u32,
    pub fcr_hashed_chunk_list: FileChunkReference64x32,
    pub fcr_transaction_log: FileChunkReference64x32,
    pub fcr_file_node_list_root: FileChunkReference64x32,
    pub fcr_free_chunk_list: FileChunkReference64x32,
    pub cb_expected_file_length: u64,
    pub cb_free_space_in_free_chunk_list: u64,
    pub guid_file_version: Guid,
    pub n_file_version_generation: u64,
    pub guid_deny_read_file_version: Guid,
    pub grf_debug_log_flags: u32,
    pub fcr_debug_log: FileChunkReference64x32,
    pub fcr_alloc_verification_free_chunk_list: FileChunkReference64x32,
    pub bn_created: u32,
    pub bn_last_wrote_to_this_file: u32,
    pub bn_oldest_written: u32,
    pub bn_newest_written: u32,
}

impl OneStoreHeader {
    pub fn parse(reader: Reader) -> Result<Self> {
        let file_type = Guid::parse(reader)?;
        let guid_file = Guid::parse(reader)?;
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
        let ffv_last_code_that_wrote_to_this_file = reader.get_u32()?;
        let ffv_oldest_code_that_has_written_to_this_file = reader.get_u32()?;
        let ffv_newest_code_that_has_written_to_this_file = reader.get_u32()?;
        let ffv_oldest_code_that_may_read_this_file = reader.get_u32()?;
        let fcr_legacy_free_chunk_list = FileChunkReference32::parse(reader)?;
        let fcr_legacy_transaction_log = FileChunkReference32::parse(reader)?;
        let c_transactions_in_log = reader.get_u32()?;
        let cb_legacy_expected_file_length = reader.get_u32()?;
        let rgb_placeholder = reader.get_u64()?;
        let fcr_legacy_file_node_list_root = FileChunkReference32::parse(reader)?;
        let cb_legacy_free_space_in_free_chunk_list = reader.get_u32()?;
        let f_needs_defrag = reader.get_u8()?;
        let f_repaired_file = reader.get_u8()?;
        let f_needs_garbage_collect = reader.get_u8()?;
        let f_has_no_embedded_file_objects = reader.get_u8()?;
        let guid_ancestor = Guid::parse(reader)?;
        let crc_name = reader.get_u32()?;
        let fcr_hashed_chunk_list = FileChunkReference64x32::parse(reader)?;
        let fcr_transaction_log = FileChunkReference64x32::parse(reader)?;
        let fcr_file_node_list_root = FileChunkReference64x32::parse(reader)?;
        let fcr_free_chunk_list = FileChunkReference64x32::parse(reader)?;
        let cb_expected_file_length = reader.get_u64()?;
        let cb_free_space_in_free_chunk_list = reader.get_u64()?;
        let guid_file_version = Guid::parse(reader)?;
        let n_file_version_generation = reader.get_u64()?;
        let guid_deny_read_file_version = Guid::parse(reader)?;
        let grf_debug_log_flags = reader.get_u32()?;
        let fcr_debug_log = FileChunkReference64x32::parse(reader)?;
        let fcr_alloc_verification_free_chunk_list = FileChunkReference64x32::parse(reader)?;
        let bn_created = reader.get_u32()?;
        let bn_last_wrote_to_this_file = reader.get_u32()?;
        let bn_oldest_written = reader.get_u32()?;
        let bn_newest_written = reader.get_u32()?;

        // Skip rgbReserved
        reader.advance(728)?;

        Ok(Self {
            file_type,
            guid_file,
            legacy_file_version,
            file_format,
            ffv_last_code_that_wrote_to_this_file,
            ffv_oldest_code_that_has_written_to_this_file,
            ffv_newest_code_that_has_written_to_this_file,
            ffv_oldest_code_that_may_read_this_file,
            fcr_legacy_free_chunk_list,
            fcr_legacy_transaction_log,
            c_transactions_in_log,
            cb_legacy_expected_file_length,
            rgb_placeholder,
            fcr_legacy_file_node_list_root,
            cb_legacy_free_space_in_free_chunk_list,
            f_needs_defrag,
            f_repaired_file,
            f_needs_garbage_collect,
            f_has_no_embedded_file_objects,
            guid_ancestor,
            crc_name,
            fcr_hashed_chunk_list,
            fcr_transaction_log,
            fcr_file_node_list_root,
            fcr_free_chunk_list,
            cb_expected_file_length,
            cb_free_space_in_free_chunk_list,
            guid_file_version,
            n_file_version_generation,
            guid_deny_read_file_version,
            grf_debug_log_flags,
            fcr_debug_log,
            fcr_alloc_verification_free_chunk_list,
            bn_created,
            bn_last_wrote_to_this_file,
            bn_oldest_written,
            bn_newest_written,
        })
    }
}
