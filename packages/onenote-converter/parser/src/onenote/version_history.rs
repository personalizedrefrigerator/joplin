use std::rc::Rc;

use crate::one::property::object_reference::ObjectReference;
use crate::one::property::time::Timestamp;
use crate::one::property::PropertyType;
use crate::one::property_set::PropertySetId;
use crate::onestore::object::Object;
use crate::onestore::object_space::ObjectSpaceRef;
use crate::page::Page;
use parser_utils::errors::{ErrorKind, Result};

/// Version history for a page.
/// 
/// See [\[MS-ONESTORE\] 2.2.37](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-one/18c08985-01ce-4966-affa-03a6ae535768)
#[derive(Clone, Debug)]
pub struct VersionHistory {
    versions: Vec<Version>,
}

impl VersionHistory {
    pub fn last_version(&self) -> Option<&Version> {
        self.versions.iter().last()
    }
}

pub(crate) fn is_version_history(space: ObjectSpaceRef) -> bool {
    if let Ok(metadata_object) = get_metadata_object(space) {
        metadata_object.id() == PropertySetId::VersionHistoryMetadata.as_jcid()
    } else {
        false
    }
}

pub(crate) fn parse_version_history(space: ObjectSpaceRef) -> Result<VersionHistory> {
    if !is_version_history(space.clone()) {
        return Err(parser_error!(MalformedOneNoteData, "not a version history page").into());
    }

    Ok(VersionHistory {
        versions: parse_versions(space)?
    })
}

fn get_metadata_object(space: ObjectSpaceRef) -> Result<Rc<Object>> {
    let metadata_id = space
        .metadata_root()
        .ok_or_else(|| ErrorKind::MalformedOneNoteData("version metadata id is missing".into()))?;
    let metadata_object = space
        .get_object(metadata_id)
        .ok_or_else(|| ErrorKind::MalformedOneNoteData("version metadata object is missing".into()))?;

    Ok(metadata_object)
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Version {
    last_modified: Timestamp,
    pub content: Page,
}

fn parse_version(object: Rc<Object>) -> Result<Version> {
    println!("DEBUG: {:?}", object.props().properties);
    todo!()
}

fn parse_versions(space: ObjectSpaceRef) -> Result<Vec<Version>> {
    let content_id = space
        .content_root()
        .ok_or_else(|| parser_error!(MalformedOneNoteData, "version content id is missing"))?;
    let content_object = space
        .get_object(content_id)
        .ok_or_else(|| parser_error!(MalformedOneNoteData, "version content object is missing"))?;

    let child_ids = ObjectReference::parse_vec(PropertyType::ElementChildNodes, &content_object)?
        .unwrap_or_default();

    let mut children = Vec::new();
    for id in child_ids {
        let object = space.get_object(id)
            .ok_or_else(|| parser_error!(MalformedOneNoteData, "No object found with ID {:?}", id))?;
        children.push(parse_version(object)?);
    }

    Ok(children)
}

