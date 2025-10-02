use std::collections::HashMap;

use super::id_mapping::IdMapping;

use parser_utils::{errors::{ErrorKind, Result}, log_warn};

use crate::{local_onestore::{file_node::{FileNodeData, FileNode}, IdTable}, shared::{exguid::ExGuid}};

pub struct GraphBuilder<'a> {
    objects: Vec<ObjectBuilder<'a>>,
}

impl <'a> GraphBuilder<'a> {
    pub fn new() -> Self {
        Self { objects: Vec::new() }
    }

    fn add(&mut self, object: ObjectBuilder<'a>) {
        self.objects.push(object);
    }

    fn add_maybe(&mut self, object: Option<ObjectBuilder<'a>>) {
        if let Some(object) = object {
            self.add(object);
        }
    }

    pub fn push(&mut self, node: &'a FileNode) -> Result<()> {
        let mut handled = true;
        // Nodes that don't require prior nodes to be on the stack:
        match &node.fnd {
            FileNodeData::GlobalIdTableStart2FND|FileNodeData::GlobalIdTableStartFNDX(_) => {
                self.add(ObjectBuilder::UnresolvedIdTable(IdMapping::new(), IdReferenceMapping::new()));
            },
            FileNodeData::ObjectSpaceManifestListReferenceFND(entry) => {
                entry.last_revision
                self.add(ObjectBuilder::ObjectSpace);
            },
            _ => {
                handled = false;
            },
        }

        if !handled {
            if let Some(last_object) = self.objects.pop() {
                // Nodes that DO require prior nodes to be on the stack
                handled = self.update_last(node, last_object)?;
            }
        }

        if !handled {
            log_warn!("Unhandled node.");
            self.add(ObjectBuilder::Unknown(node));
        }

        Ok(())
    }

    /// Updates the last (in-progress) node and, when complete, **adds it back** to the stack.
    fn update_last(&mut self, node: &'a FileNode, last_object: ObjectBuilder<'a>) -> Result<bool> {
        match &node.fnd {
            FileNodeData::GlobalIdTableEntryFNDX(entry) => {
                if let ObjectBuilder::UnresolvedIdTable(mut mapping, ref_mapping) = last_object {
                    mapping.add_mapping(entry.index, entry.guid);
                    self.add(ObjectBuilder::UnresolvedIdTable(mapping, ref_mapping));
                } else {
                    self.add(last_object);
                    return Err(
                        ErrorKind::MalformedOneNoteData("GlobalIdTableEntryFNDX needs a global ID table to update.".into()).into()
                    );
                }
                Ok(true)
            },
            FileNodeData::GlobalIdTableEntry2FNDX(entry) => {
                if let ObjectBuilder::UnresolvedIdTable(mapping, mut ref_mapping) = last_object {
                    ref_mapping.parent_references.insert(entry.i_index_map_from, entry.i_index_map_to);
                    self.add(ObjectBuilder::UnresolvedIdTable(mapping, ref_mapping));
                } else {
                    self.add(last_object);
                    return Err(
                        ErrorKind::MalformedOneNoteData("GlobalIdTableEntry2FNDX needs a global ID table to update.".into()).into()
                    );
                }
                Ok(true)
            },
            _ => {
                self.add(last_object);
                Ok(false)
            },
        }
    }
}


enum ObjectBuilder<'a> {
    /// A partially-resolved ID table. At this stage, the table may reference other
    /// table entries.
    UnresolvedIdTable(IdMapping, IdReferenceMapping),
    /// A fully-resolved ID table.
    IdTable(IdMapping),
    Revision {
        ids: IdTable,
        objects: HashMap<ExGuid, &'a FileNode>,
    },
    Unknown(&'a FileNode),
}
