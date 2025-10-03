pub mod file_node;
mod file_node_chunk_reference;

pub use file_node::FileNode;
pub use file_node::FileNodeData;

#[derive(Clone, Debug, Hash, PartialEq, Eq)]
pub struct NodeId(usize);
