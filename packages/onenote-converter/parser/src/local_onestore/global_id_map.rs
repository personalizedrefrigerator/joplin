use std::{collections::HashMap, rc::Rc};

use crate::{
    local_onestore::objects::{
        object::Object, revision::Revision, root_file_node_list::RootFileNodeList,
    },
    shared::exguid::ExGuid,
};
use parser_utils::errors::Result;

#[derive(Debug)]
pub struct IdLookupTable {
    id_to_object: HashMap<ExGuid, Rc<Object>>,
    id_to_revision: HashMap<ExGuid, Rc<Revision>>,
}

impl IdLookupTable {
    pub fn build(root_file_node_list: &RootFileNodeList) -> Result<IdLookupTable> {
        let mut result = Self {
            id_to_object: HashMap::new(),
            id_to_revision: HashMap::new(),
        };

        for object_space in &root_file_node_list.object_spaces {
            result.id_to_object.extend(
                object_space
                    .id_to_object
                    .iter()
                    .map(|(guid, object)| (*guid, object.clone())),
            );
            result.id_to_revision.extend(
                object_space
                    .id_to_revision
                    .iter()
                    .map(|(guid, revision)| (*guid, revision.clone())),
            );
        }

        Ok(result)
    }

    pub fn object_by_id(&self, id: &ExGuid) -> Option<Rc<Object>> {
        self.id_to_object
            .get(id)
            .map(|object_ref| object_ref.clone())
    }
}
