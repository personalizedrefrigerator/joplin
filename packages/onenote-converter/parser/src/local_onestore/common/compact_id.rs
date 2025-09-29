use parser_utils::parse::Parse;

/// [\[MS-ONESTORE\] 2.2.2](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/8de02f24-9b9c-48a9-bd26-5c0230814bf4)
#[derive(Debug)]
pub struct CompactId {
	n: u8,
	guid_index: u32,
}

impl Parse for CompactId {
	fn parse(reader: parser_utils::Reader) -> parser_utils::Result<Self> {
		Ok(Self {
			n: reader.get_u8()?,
			guid_index: u32::from_le_bytes([0, reader.get_u8()?, reader.get_u8()?, reader.get_u8()?]),
		})
	}
}