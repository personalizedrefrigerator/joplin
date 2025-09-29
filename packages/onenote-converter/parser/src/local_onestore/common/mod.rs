
mod file_chunk_reference;
mod compact_id;
mod object_declaration_with_ref_count_body;
mod object_space_object_stream_header;
mod object_space_object_prop_set;

pub use object_declaration_with_ref_count_body::ObjectDeclarationWithRefCountBody;
pub use compact_id::CompactId;
pub use file_chunk_reference::{
	FileChunkReference32,
	FileChunkReference64x32,
	FileChunkReference64,
	FileChunkReference,
};
