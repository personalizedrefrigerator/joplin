use super::mapping_table::MappingTable;
use crate::{
    onestore::mapping_table::mapping_table_fallback,
    shared::{
        exguid::ExGuid, file_data_ref::FileBlob, jcid::JcId, object_prop_set::ObjectPropSet,
        prop_set::PropertySet,
    },
};
use parser_utils::Result;
use std::rc::Rc;

pub trait ObjectFileData {
    fn load(&self) -> Result<FileBlob>;
}

impl ObjectFileData for FileBlob {
    fn load(&self) -> Result<FileBlob> {
        Ok(self.clone())
    }
}

#[derive(Clone)]
pub(crate) struct Object {
    pub(crate) context_id: ExGuid,

    pub(crate) jc_id: JcId,
    pub(crate) props: ObjectPropSet,
    pub(crate) file_data: Option<Rc<dyn ObjectFileData>>,
    pub(crate) mapping: Rc<dyn MappingTable>,
}

impl std::fmt::Debug for Object {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Object(type:{:?})", self.jc_id)
    }
}

impl Object {
    pub fn id(&self) -> JcId {
        self.jc_id
    }

    pub fn props(&self) -> &ObjectPropSet {
        &self.props
    }

    pub(crate) fn fallback() -> Object {
        Self {
            jc_id: JcId { 0: 0 },
            context_id: ExGuid::fallback(),
            file_data: None,
            mapping: mapping_table_fallback(),
            props: ObjectPropSet {
                object_ids: Vec::from([]),
                object_space_ids: Vec::from([]),
                context_ids: Vec::from([]),
                properties: PropertySet::fallback(),
            },
        }
    }
}
