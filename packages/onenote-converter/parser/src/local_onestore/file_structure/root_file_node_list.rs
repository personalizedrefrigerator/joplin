use parser_utils::errors::{ErrorKind, Result};
use parser_utils::parse::ParseWithCount;
use parser_utils::Reader;

use crate::local_onestore::common::{FileChunkReference, FileChunkReference64x32};
use crate::local_onestore::file_node::{FileNode, FileNodeData};
use crate::local_onestore::file_structure::FileNodeListFragment;

#[derive(Debug, Clone)]
pub struct RootFileNodeList {
    file_node_list_fragments: Vec<FileNodeListFragment>,
    pub file_node_sequence: Vec<FileNodeData>,
}

impl ParseWithCount for RootFileNodeList {
    fn parse(reader: Reader, size: usize) -> Result<Self> {
        let mut builder = RootFileNodeListBuilder {
            next_fragment_id: 0,
            file_node_list_fragments: Vec::new(),
            file_node_sequence: Vec::new(),
        };

        let mut next_fragment_ref =
            builder.add_fragment(FileNodeListFragment::parse(reader, size)?)?;
        while !next_fragment_ref.is_fcr_nil() && !next_fragment_ref.is_fcr_zero() {
            let mut reader = next_fragment_ref.resolve_to_reader(reader)?;
            let fragment = FileNodeListFragment::parse(&mut reader, next_fragment_ref.cb as usize)?;
            next_fragment_ref = builder.add_fragment(fragment)?;
        }
        Ok(Self {
            file_node_list_fragments: builder.file_node_list_fragments,
            file_node_sequence: builder.file_node_sequence,
        })
    }
}

struct RootFileNodeListBuilder {
    pub file_node_list_fragments: Vec<FileNodeListFragment>,
    pub file_node_sequence: Vec<FileNodeData>,

    // Used for validation during construction
    next_fragment_id: u32,
}

impl RootFileNodeListBuilder {
    fn add_fragment(&mut self, fragment: FileNodeListFragment) -> Result<FileChunkReference64x32> {
        let fragment_sequence = fragment.header.n_fragment_sequence;
        if fragment_sequence != self.next_fragment_id {
            return Err(ErrorKind::MalformedOneStoreData(
                format!(
                    "Invalid n_fragment_sequence. Was {}, expected {}",
                    fragment_sequence, self.next_fragment_id
                )
                .into(),
            )
            .into());
        }
        self.next_fragment_id = fragment_sequence + 1;

        for item in fragment
            .file_nodes
            .iter()
            .filter(|f| !matches!(f.fnd, FileNode::ChunkTerminatorFND))
        {
            self.file_node_sequence.push(item.clone());
        }
        let next_fragment_ref = fragment.next_fragment.clone();
        self.file_node_list_fragments.push(fragment);
        Ok(next_fragment_ref)
    }
}

impl RootFileNodeList {
    /// Iterate over all nodes.
    /// TODO: Currently, this uses depth-first search. It may need to be changed to breadth-first.
    pub fn iter_recursive<'a>(&'a self) -> RootFileNodeListIterator<'a> {
        RootFileNodeListIterator::new(self)
    }
}

pub struct RootFileNodeListIterator<'a> {
    data: &'a RootFileNodeList,
    sub_iterator: Option<Box<RootFileNodeListIterator<'a>>>,
    index: usize,
}

impl<'a> RootFileNodeListIterator<'a> {
    fn new(node_list: &'a RootFileNodeList) -> Self {
        RootFileNodeListIterator {
            data: node_list,
            sub_iterator: None,
            index: 0,
        }
    }
}

impl <'a> Iterator for RootFileNodeListIterator<'a> {
    type Item = &'a FileNodeData;
    fn next(&mut self) -> Option<Self::Item> {
        if self.index >= self.data.file_node_sequence.len() {
            return None;
        }

        // Continue iterating through a child node
        if let Some(sub_iterator) = &mut self.sub_iterator {
            let next = sub_iterator.next();
            if let None = next {
                self.sub_iterator = None;
            } else {
                return next;
            }
        }

        let result = &self.data.file_node_sequence[self.index];
        self.index += 1;
        self.sub_iterator = result.get_children().map(
            |children| Box::new(children.iter_recursive())
        );

        Some(result)
    }
}
