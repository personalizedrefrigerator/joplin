use super::super::common::FileChunkReference64x32;
use parser_utils::errors::{ErrorKind, Result};
use parser_utils::parse::Parse;
use parser_utils::{log_warn, Reader};

/// See [\[MS-ONESTORE\] 2.3.3.1](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/158030a2-dbf0-4b92-bf6e-1a91a403aebd)
#[derive(Debug)]
pub struct TransactionLogFragment {
    size_table: Vec<TransactionEntry>,
    pub next_fragment: FileChunkReference64x32,
}

impl TransactionLogFragment {
    pub fn parse(reader: Reader, size: usize) -> Result<Self> {
        // According to \[MS-ONESTORE\] 2.3.3.1, the size_table should terminate with a
        // sentinel entry. However, 
        let size_table_count = (size - 12) / 8;
        let mut size_table = Vec::new();
        let mut encountered_sentinel = false;
        for i in 0..size_table_count {
            let entry = TransactionEntry::parse(reader)?;

            if entry.is_sentinel() {
                encountered_sentinel = true;
            } else if encountered_sentinel && (entry.src_id != 0 || entry.transaction_entry_switch != 0) {
                log_warn!("Unexpected data {:?} (idx {}/{}) after sentinel in TransactionLogFragment.", entry, i, size_table_count).into()
            }

            if !encountered_sentinel {
                size_table.push(entry);
            }
        }

        if size_table_count > 0 && !encountered_sentinel {
            return Err(
                ErrorKind::MalformedOneStoreData(
                    format!(
                        "The size_table must end in a sentinel entry. Total entries: {}. Last entry: {:?}",
                        size_table_count,
                        size_table[size_table_count - 1]
                    ).into()
                ).into()
            )
        }

        Ok(Self {
            size_table,
            next_fragment: FileChunkReference64x32::parse(reader)?,
        })
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
