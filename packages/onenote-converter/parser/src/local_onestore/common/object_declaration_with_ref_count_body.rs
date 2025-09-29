
use parser_utils::parse::Parse;
use super::CompactId;

/// See [\[MS-ONESTORE\] 2.16.15](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/b04f1a51-6e1b-496d-8921-da27d7fb8a3f)
#[derive(Debug, Parse)]
pub struct ObjectDeclarationWithRefCountBody {
	oid: CompactId,
	ignored: u32,
}
