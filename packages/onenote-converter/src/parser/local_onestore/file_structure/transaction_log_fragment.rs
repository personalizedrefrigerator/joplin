use crate::parser::errors::Result;
use crate::parser::Reader;
use super::super::common::FileChunkReference64x32;

/// See [\[MS-ONESTORE\] 2.3.3.1](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/158030a2-dbf0-4b92-bf6e-1a91a403aebd)
#[derive(Debug)]
pub struct TransactionLogFragment {
	size_table: Vec<TransactionEntry>,
	next_fragment: FileChunkReference64x32,
}

impl TransactionLogFragment {
	pub fn parse(reader: Reader) -> Result<Self> {
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

		let next_fragment = FileChunkReference64x32::parse(reader)?;
		Ok(Self {
			size_table,
			next_fragment,
		})
	}
}

/// See [\[MS-ONESTORE\] 2.3.3.2](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/c00897d9-d90a-4707-b9fb-58c93e490322)
#[derive(Debug)]
struct TransactionEntry {
	src_id: u32,
	transaction_entry_switch: u32,
}

impl TransactionEntry {
	pub fn parse(reader: Reader)->Result<Self> {
		let src_id = reader.get_u32()?;
		let transaction_entry_switch = reader.get_u32()?;
		Ok(Self { src_id, transaction_entry_switch })
	}

	pub fn is_sentinel(&self)->bool {
		self.src_id == 0x00000001
	}
}
