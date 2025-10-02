mod file_node_chunk_reference;
pub mod file_node;

pub use file_node::FileNodeData;
pub use file_node::FileNode;

#[derive(Clone, Debug, Hash, PartialEq, Eq)]
pub struct NodeId(usize);
