use std::fmt::Debug;

use crate::{
    local_onestore::{
        file_node::{file_node::ObjectDeclarationNode, FileNodeData},
        file_structure::FileNodeDataIterator,
    },
    shared::{compact_id::CompactId, jcid::JcId, object_prop_set::ObjectPropSet},
};
use parser_utils::errors::Result;

// TODO: Merge with src/onestore/object.rs
pub struct Object {
    pub compact_id: CompactId,
    pub jc_id: JcId,
    pub props: ObjectPropSet,
}

impl Debug for Object {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Object(jc_id={:?}, props=...)", self.jc_id)
    }
}

impl Object {
    pub fn try_parse(iterator: &mut FileNodeDataIterator) -> Result<Option<Self>> {
        let current = iterator.peek();
        let result = match current {
            Some(FileNodeData::ObjectDeclaration2RefCountFND(data)) => {
                Some(Self::parse_from_declaration(data)?)
            }
            Some(FileNodeData::ObjectDeclaration2LargeRefCountFND(data)) => {
                Some(Self::parse_from_declaration(data)?)
            }
            Some(FileNodeData::ReadOnlyObjectDeclaration2RefCountFND(data)) => {
                Some(Self::parse_from_declaration(data)?)
            }
            Some(FileNodeData::ReadOnlyObjectDeclaration2LargeRefCountFND(data)) => {
                Some(Self::parse_from_declaration(data)?)
            }
            Some(FileNodeData::ObjectDeclarationFileData3RefCountFND(data)) => {
                Some(Self::parse_from_declaration(data)?)
            }
            Some(FileNodeData::ObjectDeclarationFileData3LargeRefCountFND(data)) => {
                Some(Self::parse_from_declaration(data)?)
            }
            Some(_) => None,
            None => None,
        };
        // Ensure that the iterator always advances when parsing
        if result.is_some() {
            iterator.next();
        }
        Ok(result)
    }

    fn parse_from_declaration(declaration: &dyn ObjectDeclarationNode) -> Result<Self> {
        let properties = declaration.get_props().map(|props| props.clone());
        Ok(Self {
            compact_id: declaration.get_compact_id(),
            jc_id: declaration.get_jcid(),
            // TODO: Change to a reference?
            props: properties.unwrap_or_default(),
        })
    }
}
