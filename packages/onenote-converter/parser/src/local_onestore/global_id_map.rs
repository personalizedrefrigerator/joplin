use std::{collections::HashMap, rc::Rc};

use crate::{local_onestore::objects::{object::Object, revision::Revision, root_file_node_list::RootFileNodeList}, shared::exguid::ExGuid};
use parser_utils::errors::Result;

#[derive(Debug)]
pub struct GlobalIdMap {
    id_to_object: HashMap<ExGuid, Rc<Object>>,
    id_to_revision: HashMap<ExGuid, Rc<Revision>>,
}

impl GlobalIdMap {
    pub fn build(root_file_node_list: &RootFileNodeList) -> Result<GlobalIdMap> {
        let mut result = Self {
            id_to_object: HashMap::new(), id_to_revision: HashMap::new(),
        };

        for object_space in &root_file_node_list.object_spaces {
            for (revision_id, revision) in &object_space.revision_list.revisions {
                // TODO: Use global_id_tables if present. This may be required for parsing
                //      .onetoc2 files, which allow references from one ID table to another.
                let global_id_tables = &revision.global_id_tables;
                
                for object_group in &revision.object_groups {
                    let id_table = &object_group.id_table;
                    for object_ref in &object_group.objects {
                        let id = id_table.resolve_id(&object_ref.compact_id)?;
                        result.id_to_object.insert(id, object_ref.clone());
                    }
                }
                result.id_to_revision.insert(*revision_id, revision.clone());
            }
        }

        Ok(result)
    }

    pub fn object_by_id(&self, id: &ExGuid) -> Option<Rc<Object>> {
        self.id_to_object.get(id).map(|object_ref| object_ref.clone())
    }
}