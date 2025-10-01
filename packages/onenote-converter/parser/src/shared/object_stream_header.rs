use parser_utils::errors::Result;
use parser_utils::Reader;

/// An object stream header.
///
/// See [\[MS-ONESTORE\] 2.6.5].
///
/// [\[MS-ONESTORE\] 2.6.5]: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/34497a17-3623-4e1d-9488-a2e111a9a279
#[derive(Debug)]
pub(crate) struct ObjectStreamHeader {
    pub(crate) count: u32,
    pub(crate) extended_streams_present: bool,
    pub(crate) osid_stream_not_present: bool,
}

impl ObjectStreamHeader {
    pub(crate) fn parse(reader: Reader) -> Result<ObjectStreamHeader> {
        let data = reader.get_u32()?;

        let count = data & 0xFFFFFF;
        println!("Read ObjectStreamHeader: {:#010x} = {:#010b}; count: {}", data, data, count);
        // assert_eq!(data & 0x3F000000, 0); // Reserved: Must be 0 and ignored
        let extended_streams_present = (data >> 30) & 0x1 != 0;
        let osid_stream_not_present = (data >> 31) != 0;

        Ok(ObjectStreamHeader {
            count,
            extended_streams_present,
            osid_stream_not_present,
        })
    }
}
