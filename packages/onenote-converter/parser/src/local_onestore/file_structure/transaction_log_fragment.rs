use super::super::common::FileChunkReference64x32;
use parser_utils::errors::Result;
use parser_utils::parse::Parse;
use parser_utils::Reader;

/// See [\[MS-ONESTORE\] 2.3.3.1](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/158030a2-dbf0-4b92-bf6e-1a91a403aebd)
#[derive(Debug, Parse)]
pub struct TransactionLogFragment {
    size_table: SizeTable,
    next_fragment: FileChunkReference64x32,
}

#[derive(Debug)]
struct SizeTable(Vec<TransactionEntry>);
impl Parse for SizeTable {
    fn parse(reader: Reader) -> Result<Self> {
        let mut size_table = Vec::new();
        loop {
            let current = TransactionEntry::parse(reader)?;
            if current.is_sentinel() {
                // In this case, the transaction_entry_switch is the CRC of the
                // transaction entry structures
                break;
            }

            size_table.push(current);
        }

        Ok(Self(size_table))
    }
}

/// See [\[MS-ONESTORE\] 2.3.3.2](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/c00897d9-d90a-4707-b9fb-58c93e490322)
#[derive(Debug, Parse)]
struct TransactionEntry {
    src_id: u32,
    transaction_entry_switch: u32,
}

impl TransactionEntry {
    pub fn is_sentinel(&self) -> bool {
        self.src_id == 0x00000001
    }
}
