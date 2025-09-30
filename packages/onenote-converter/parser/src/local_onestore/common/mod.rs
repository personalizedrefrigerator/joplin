
mod file_chunk_reference;
mod object_declaration_with_ref_count_body;
mod object_space_object_stream_header;
mod object_space_object_prop_set;

pub use object_declaration_with_ref_count_body::ObjectDeclarationWithRefCountBody;
pub use object_space_object_prop_set::ObjectSpaceObjectPropSet;
pub use file_chunk_reference::{
	FileChunkReference32,
	FileChunkReference64x32,
	FileChunkReference64,
	FileChunkReference,
};
