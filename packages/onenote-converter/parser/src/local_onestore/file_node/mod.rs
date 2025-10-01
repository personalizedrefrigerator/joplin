mod file_node_chunk_reference;
mod file_node;

pub use file_node::FileNode;
pub use file_node::FileNodeData;

#[derive(Clone, Debug, Hash, PartialEq, Eq)]
pub struct NodeId(usize);
