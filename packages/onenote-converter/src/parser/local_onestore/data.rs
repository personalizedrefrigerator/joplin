
/// See [\[MS-ONESTORE\] 2.2.4.4]
/// 
/// [\[MS-ONESTORE\] 2.2.4.4]: https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/e2815e73-bd04-42fc-838e-6e86ab192e54
#[derive(Debug)]
pub(crate) struct FileChunkReference64x32 {
    data_location: u64,
    data_size: u32,
}
