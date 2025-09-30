use parser_utils::errors::Result;
use parser_utils::Reader;

use crate::local_onestore::common::{FileChunkReference, FileChunkReference64x32};
use crate::local_onestore::file_node::{FileNode, FileNodeData};
use crate::local_onestore::file_structure::FileNodeListFragment;

#[derive(Debug)]
pub struct RootFileNodeList {
    pub file_node_list_fragments: Vec<FileNodeListFragment>,
    pub file_node_sequence: Vec<FileNodeData>,
}

impl RootFileNodeList {
    pub fn parse(reader: Reader, size: usize) -> Result<Self> {
        let mut builder = RootFileNodeList {
            file_node_list_fragments: Vec::new(),
            file_node_sequence: Vec::new(),
        };

        let mut next_fragment_ref =
            builder.add_fragment(FileNodeListFragment::parse(reader, size)?);
        while !next_fragment_ref.is_fcr_nil() && !next_fragment_ref.is_fcr_zero() {
            let mut reader = reader.with_start_index(next_fragment_ref.stp as usize)?;
            let fragment = FileNodeListFragment::parse(&mut reader, next_fragment_ref.cb as usize)?;
            next_fragment_ref = builder.add_fragment(fragment);
        }
        Ok(builder)
    }

    fn add_fragment(&mut self, fragment: FileNodeListFragment) -> FileChunkReference64x32 {
        for item in fragment
            .file_nodes
            .iter()
            .filter(|f| !matches!(f.fnd, FileNode::ChunkTerminatorFND))
        {
            self.file_node_sequence.push(item.clone());
        }
        let next_fragment_ref = fragment.next_fragment.clone();
        self.file_node_list_fragments.push(fragment);
        next_fragment_ref
    }
}
