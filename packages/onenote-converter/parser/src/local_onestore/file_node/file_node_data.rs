use super::super::common::ObjectDeclarationWithRefCountBody;
use super::file_node_chunk_reference::FileNodeChunkReference;
use crate::local_onestore::common::FileChunkReference;
use crate::shared::compact_id::CompactId;
use crate::shared::exguid::ExGuid;
use crate::shared::jcid::JcId;
use crate::shared::object_prop_set::ObjectPropSet;
use parser_utils::parse::{Parse, ParseWithCount};
use parser_utils::Utf16ToString;
use parser_utils::{Reader, Result};

use crate::shared::guid::Guid;

/// See [\[MS-ONESTORE\] 2.4.3](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/25a9b048-f91a-48d1-b803-137b7194e69e)

pub struct FileNodeData {
    node_id: u32,
    stp_format: u32,
    cb_format: u32,
    base_type: u32,
    size: u32,
    fnd: FileNode,
}

impl Parse for FileNodeData {
    fn parse(reader: parser_utils::Reader) -> Result<Self> {
        let first_line = reader.get_u32()?;
        let node_id = first_line & 0x3FF; // First 10 bits
        let size = (first_line >> 10) & 0x1FFF; // Next 13 bits
        let stp_format = (first_line >> 23) & 0x3; // Next 2 bits
        let cb_format = (first_line >> 25) & 0x3; // Next 2 bits
        let base_type = (first_line >> 27) & 0xF;
        // Last bit is reserved

        let fnd = match node_id {
            0x004 => {
                FileNode::ObjectSpaceManifestRootFND(ObjectSpaceManifestRootFND::parse(reader)?)
            }
            0x008 => FileNode::ObjectSpaceManifestListReferenceFND(
                ObjectSpaceManifestListReferenceFND::parse(reader, stp_format, cb_format)?,
            ),
            0x00C => FileNode::ObjectSpaceManifestListStartFND(
                ObjectSpaceManifestListStartFND::parse(reader)?,
            ),
            0x010 => FileNode::RevisionManifestListReferenceFND(
                RevisionManifestListReferenceFND::parse(reader, stp_format, cb_format)?,
            ),
            0x014 => {
                FileNode::RevisionManifestListStartFND(RevisionManifestListStartFND::parse(reader)?)
            }
            0x01B => FileNode::RevisionManifestStart4FND(RevisionManifestStart4FND::parse(reader)?),
            0x01C => FileNode::RevisionManifestEndFND,
            0x01E => FileNode::RevisionManifestStart6FND(RevisionManifestStart6FND::parse(reader)?),
            0x01F => FileNode::RevisionManifestStart7FND(RevisionManifestStart7FND::parse(reader)?),
            0x021 => FileNode::GlobalIdTableStartFNDX(GlobalIdTableStartFNDX::parse(reader)?),
            0x022 => FileNode::GlobalIdTableStart2FND,
            0x024 => FileNode::GlobalIdTableEntryFNDX(GlobalIdTableEntryFNDX::parse(reader)?),
            0x025 => FileNode::GlobalIdTableEntry2FNDX(GlobalIdTableEntry2FNDX::parse(reader)?),
            0x026 => FileNode::GlobalIdTableEntry3FNDX(GlobalIdTableEntry3FNDX::parse(reader)?),
            0x028 => FileNode::GlobalIdTableEndFNDX,
            0x02D => FileNode::ObjectDeclarationWithRefCountFNDX(
                ObjectDeclarationWithRefCountFNDX::parse(reader, stp_format, cb_format)?,
            ),
            0x02E => FileNode::ObjectDeclarationWithRefCount2FNDX(
                ObjectDeclarationWithRefCount2FNDX::parse(reader, stp_format, cb_format)?,
            ),
            0x041 => FileNode::ObjectRevisionWithRefCountFNDX(
                ObjectRevisionWithRefCountFNDX::parse(reader, stp_format, cb_format)?,
            ),
            0x042 => FileNode::ObjectRevisionWithRefCount2FNDX(
                ObjectRevisionWithRefCount2FNDX::parse(reader, stp_format, cb_format)?,
            ),
            0x059 => FileNode::RootObjectReference2FNDX(RootObjectReference2FNDX::parse(reader)?),
            0x05A => FileNode::RootObjectReference3FND(RootObjectReference3FND::parse(reader)?),
            0x05C => {
                FileNode::RevisionRoleDeclarationFND(RevisionRoleDeclarationFND::parse(reader)?)
            }
            0x05D => FileNode::RevisionRoleAndContextDeclarationFND(
                RevisionRoleAndContextDeclarationFND::parse(reader)?,
            ),
            0x072 => FileNode::ObjectDeclarationFileData3RefCountFND(
                ObjectDeclarationFileData3RefCountFND::parse(reader)?,
            ),
            0x073 => FileNode::ObjectDeclarationFileData3LargeRefCountFND(
                ObjectDeclarationFileData3LargeRefCountFND::parse(reader)?,
            ),
            0x07C => FileNode::ObjectDataEncryptionKeyV2FNDX(ObjectDataEncryptionKeyV2FNDX::parse(
                reader, stp_format, cb_format,
            )?),
            0x084 => FileNode::ObjectInfoDependencyOverridesFND(
                ObjectInfoDependencyOverridesFND::parse(reader, stp_format, cb_format)?,
            ),
            0x08C => FileNode::DataSignatureGroupDefinitionFND(
                DataSignatureGroupDefinitionFND::parse(reader)?,
            ),
            0x090 => FileNode::FileDataStoreListReferenceFND(FileDataStoreListReferenceFND::parse(
                reader, stp_format, cb_format,
            )?),
            0x094 => FileNode::FileDataStoreObjectReferenceFND(
                FileDataStoreObjectReferenceFND::parse(reader, stp_format, cb_format)?,
            ),
            0x0A4 => FileNode::ObjectDeclaration2RefCountFND(ObjectDeclaration2RefCountFND::parse(
                reader, stp_format, cb_format,
            )?),
            0x0A5 => FileNode::ObjectDeclaration2LargeRefCountFND(
                ObjectDeclaration2LargeRefCountFND::parse(reader, stp_format, cb_format)?,
            ),
            0x0B0 => FileNode::ObjectGroupListReferenceFND(ObjectGroupListReferenceFND::parse(
                reader, stp_format, cb_format,
            )?),
            0x0B4 => FileNode::ObjectGroupStartFND(ObjectGroupStartFND::parse(reader)?),
            0x0B8 => FileNode::ObjectGroupEndFND,
            0x0C2 => FileNode::HashedChunkDescriptor2FND(HashedChunkDescriptor2FND::parse(
                reader, stp_format, cb_format,
            )?),
            0x0C4 => FileNode::ReadOnlyObjectDeclaration2RefCountFND(
                ReadOnlyObjectDeclaration2RefCountFND::parse(reader, stp_format, cb_format)?,
            ),
            0x0C5 => FileNode::ReadOnlyObjectDeclaration2LargeRefCountFND(
                ReadOnlyObjectDeclaration2LargeRefCountFND::parse(reader, stp_format, cb_format)?,
            ),
            0x0FF => FileNode::ChunkTerminatorFND,
            _ => FileNode::Null,
        };

        Ok(Self {
            node_id,
            stp_format,
            cb_format,
            base_type,
            size,
            fnd,
        })
    }
}

/// See [\[MS-ONESTORE\] 2.4.3](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/25a9b048-f91a-48d1-b803-137b7194e69e)
#[derive(Debug)]
pub enum FileNode {
    ObjectSpaceManifestRootFND(ObjectSpaceManifestRootFND),
    ObjectSpaceManifestListReferenceFND(ObjectSpaceManifestListReferenceFND),
    ObjectSpaceManifestListStartFND(ObjectSpaceManifestListStartFND),
    RevisionManifestListReferenceFND(RevisionManifestListReferenceFND),
    RevisionManifestListStartFND(RevisionManifestListStartFND),
    RevisionManifestStart4FND(RevisionManifestStart4FND),
    RevisionManifestEndFND,
    RevisionManifestStart6FND(RevisionManifestStart6FND),
    RevisionManifestStart7FND(RevisionManifestStart7FND),
    GlobalIdTableStartFNDX(GlobalIdTableStartFNDX),
    GlobalIdTableStart2FND,
    GlobalIdTableEntryFNDX(GlobalIdTableEntryFNDX),
    GlobalIdTableEntry2FNDX(GlobalIdTableEntry2FNDX),
    GlobalIdTableEntry3FNDX(GlobalIdTableEntry3FNDX),
    GlobalIdTableEndFNDX,
    ObjectDeclarationWithRefCountFNDX(ObjectDeclarationWithRefCountFNDX),
    ObjectDeclarationWithRefCount2FNDX(ObjectDeclarationWithRefCount2FNDX),
    ObjectRevisionWithRefCountFNDX(ObjectRevisionWithRefCountFNDX),
    ObjectRevisionWithRefCount2FNDX(ObjectRevisionWithRefCount2FNDX),
    RootObjectReference2FNDX(RootObjectReference2FNDX),
    RootObjectReference3FND(RootObjectReference3FND),
    RevisionRoleDeclarationFND(RevisionRoleDeclarationFND),
    RevisionRoleAndContextDeclarationFND(RevisionRoleAndContextDeclarationFND),
    ObjectDeclarationFileData3RefCountFND(ObjectDeclarationFileData3RefCountFND),
    ObjectDeclarationFileData3LargeRefCountFND(ObjectDeclarationFileData3LargeRefCountFND),
    ObjectDataEncryptionKeyV2FNDX(ObjectDataEncryptionKeyV2FNDX),
    ObjectInfoDependencyOverridesFND(ObjectInfoDependencyOverridesFND),
    DataSignatureGroupDefinitionFND(DataSignatureGroupDefinitionFND),
    FileDataStoreListReferenceFND(FileDataStoreListReferenceFND),
    FileDataStoreObjectReferenceFND(FileDataStoreObjectReferenceFND),
    ObjectDeclaration2RefCountFND(ObjectDeclaration2RefCountFND),
    ObjectDeclaration2LargeRefCountFND(ObjectDeclaration2LargeRefCountFND),
    ObjectGroupListReferenceFND(ObjectGroupListReferenceFND),
    ObjectGroupStartFND(ObjectGroupStartFND),
    ObjectGroupEndFND,
    HashedChunkDescriptor2FND(HashedChunkDescriptor2FND),
    ReadOnlyObjectDeclaration2RefCountFND(ReadOnlyObjectDeclaration2RefCountFND),
    ReadOnlyObjectDeclaration2LargeRefCountFND(ReadOnlyObjectDeclaration2LargeRefCountFND),
    ChunkTerminatorFND,
    Null,
}

trait ParseWithFormat
where
    Self: Sized,
{
    fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self>;
}

#[derive(Debug, Parse)]
struct ObjectSpaceManifestRootFND {
    gosid_root: Guid,
}

type ObjectSpaceManifestListReferenceFND = ObjectRefAndId<ExGuid>;

#[derive(Debug, Parse)]
struct ObjectSpaceManifestListStartFND {
    gsoid: ExGuid,
}

#[derive(Debug)]
struct RevisionManifestListReferenceFND {
    list_ref: FileNodeChunkReference,
}

impl ParseWithFormat for RevisionManifestListReferenceFND {
    fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        Ok(Self {
            list_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
        })
    }
}

#[derive(Debug)]
struct RevisionManifestListStartFND {
    gsoid: ExGuid,
    n_instance: u32,
}

impl Parse for RevisionManifestListStartFND {
    fn parse(reader: parser_utils::Reader) -> Result<Self> {
        Ok(Self {
            gsoid: ExGuid::parse(reader)?,
            n_instance: reader.get_u32()?,
        })
    }
}

#[derive(Debug, Parse)]
struct RevisionManifestStart4FND {
    rid: ExGuid,
    rid_dependent: ExGuid,
    reserved_time_creation: u64,
    revision_role: u32,
    odcs_default: u16,
}

#[derive(Debug, Parse)]
struct RevisionManifestStart6FND {
    rid: ExGuid,
    rid_dependent: ExGuid,
    revision_role: u32,
    odcs_default: u16,
}

#[derive(Debug, Parse)]
struct RevisionManifestStart7FND {
    base: RevisionManifestStart6FND,
    gctxid: ExGuid,
}

#[derive(Debug, Parse)]
struct GlobalIdTableStartFNDX {
    reserved: u8,
}

#[derive(Debug, Parse)]
struct GlobalIdTableEntryFNDX {
    index: u32,
    guid: Guid,
}

#[derive(Debug, Parse)]
struct GlobalIdTableEntry2FNDX {
    i_index_map_from: u32,
    i_index_map_to: u32,
}

#[derive(Debug, Parse)]
struct GlobalIdTableEntry3FNDX {
    i_index_copy_from_start: u32,
    c_entries_to_copy: u32,
    i_index_copy_to_start: u32,
}

#[derive(Debug)]
struct ObjectDeclarationWithSizedRefCount<RefSize: Parse> {
    object_ref: FileNodeChunkReference,
    body: ObjectDeclarationWithRefCountBody,
    c_ref: RefSize,
    property_set: ObjectPropSet,
}

fn read_property_set_and_ref(
    reader: Reader,
    stp_format: u32,
    cb_format: u32,
) -> Result<(ObjectPropSet, FileNodeChunkReference)> {
    let object_ref = FileNodeChunkReference::parse(reader, stp_format, cb_format)?;
    let mut prop_set_reader = object_ref.resolve_to_reader(reader)?;
    let prop_set = ObjectPropSet::parse(&mut prop_set_reader)?;
    Ok((prop_set, object_ref))
}

impl<RefSize: Parse> ParseWithFormat for ObjectDeclarationWithSizedRefCount<RefSize> {
    fn parse(reader: Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        let (property_set, object_ref) = read_property_set_and_ref(reader, stp_format, cb_format)?;
        Ok(Self {
            object_ref,
            body: ObjectDeclarationWithRefCountBody::parse(reader)?,
            c_ref: RefSize::parse(reader)?,
            property_set,
        })
    }
}

type ObjectDeclarationWithRefCountFNDX = ObjectDeclarationWithSizedRefCount<u8>;
type ObjectDeclarationWithRefCount2FNDX = ObjectDeclarationWithSizedRefCount<u32>;

#[derive(Debug)]
struct ObjectRevisionWithRefCountFNDX {
    object_ref: FileNodeChunkReference,
    oid: CompactId,
    f_has_oid_references: bool,
    f_has_osid_references: bool,
    property_set: ObjectPropSet,
    c_ref: u8,
}

impl ParseWithFormat for ObjectRevisionWithRefCountFNDX {
    fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        let (property_set, object_ref) = read_property_set_and_ref(reader, stp_format, cb_format)?;
        let oid = CompactId::parse(reader)?;
        let metadata = reader.get_u8()?;
        Ok(Self {
            object_ref,
            oid,
            f_has_oid_references: metadata & 0x1 > 0,
            f_has_osid_references: metadata & 0x2 > 0,
            c_ref: (metadata & 0b1111_1100) >> 2,
            property_set,
        })
    }
}

#[derive(Debug)]
struct ObjectRevisionWithRefCount2FNDX {
    object_ref: FileNodeChunkReference,
    oid: CompactId,
    f_has_oid_references: bool,
    f_has_osid_references: bool,
    property_set: ObjectPropSet,
    c_ref: u32,
}

impl ParseWithFormat for ObjectRevisionWithRefCount2FNDX {
    fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        let (property_set, object_ref) = read_property_set_and_ref(reader, stp_format, cb_format)?;
        let oid = CompactId::parse(reader)?;
        let metadata = reader.get_u32()?;
        Ok(Self {
            object_ref,
            oid,
            f_has_oid_references: metadata & 0x1 > 0,
            f_has_osid_references: metadata & 0x2 > 0,
            c_ref: reader.get_u32()?,
            property_set,
        })
    }
}

#[derive(Debug, Parse)]
struct RootObjectReference2FNDX {
    oid_root: CompactId,
    root_role: u32,
}

#[derive(Debug, Parse)]
struct RootObjectReference3FND {
    oid_root: ExGuid,
    root_role: u32,
}

#[derive(Debug, Parse)]
struct RevisionRoleDeclarationFND {
    rid: ExGuid,
    revision_role: u32,
}

#[derive(Debug, Parse)]
struct RevisionRoleAndContextDeclarationFND {
    base: RevisionRoleDeclarationFND,
    gctxid: ExGuid,
}

/// See [\[MS-ONESTORE\] 2.2.3](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/af15f3eb-f2a8-4333-8d04-e05e55c2af07)
#[derive(Debug)]
struct StringInStorageBuffer {
    cch: u32,
    data: String,
}

impl Parse for StringInStorageBuffer {
    fn parse(reader: Reader) -> Result<Self> {
        let cch = reader.get_u32()?;
        let data = reader.read(cch as usize)?;
        let data = data.utf16_to_string()?;
        Ok(Self { cch, data })
    }
}

/// See [\[MS-ONESTORE\] 2.5.27](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/da2bbc7d-0529-4bf4-a843-6f3f55c87e8f)
#[derive(Debug, Parse)]
#[validate({
    let data = &file_data_ref.data;
    data.starts_with("<file>") || data.starts_with("<ifndf>") || data.starts_with("<invfdo>")
})]
struct ObjectDeclarationFileDataRefCount<RefSize: Parse> {
    oid: CompactId,
    jcid: JcId,
    c_ref: RefSize,
    file_data_ref: StringInStorageBuffer,
    file_ext: StringInStorageBuffer,
}

type ObjectDeclarationFileData3RefCountFND = ObjectDeclarationFileDataRefCount<u8>;
type ObjectDeclarationFileData3LargeRefCountFND = ObjectDeclarationFileDataRefCount<u32>;

#[derive(Debug)]
struct ObjectRefOnly {
    data_ref: FileNodeChunkReference,
}

impl ParseWithFormat for ObjectRefOnly {
    fn parse(reader: Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        Ok(Self {
            data_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
        })
    }
}

#[derive(Debug)]
struct ObjectRefAndId<Id: Parse> {
    data_ref: FileNodeChunkReference,
    id: Id,
}

impl<Id: Parse> ParseWithFormat for ObjectRefAndId<Id> {
    fn parse(reader: Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        Ok(Self {
            data_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
            id: Id::parse(reader)?,
        })
    }
}

#[derive(Debug)]
struct ObjectRefAndHash<Hash: Parse> {
    data_ref: FileNodeChunkReference,
    hash: Hash,
}

impl<Hash: Parse> ObjectRefAndHash<Hash> {
    pub fn parse(reader: Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        Ok(Self {
            data_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
            hash: Hash::parse(reader)?,
        })
    }
}

/// Points to encrypted data. See [\[MS-ONESTORE\] 2.5.19](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/542f09eb-9db8-4b6a-86e5-2d9a930b41c0).
type ObjectDataEncryptionKeyV2FNDX = ObjectRefOnly;

#[derive(Debug, Parse)]
struct ObjectInfoDependencyOverride<RefSize: Parse> {
    oid: CompactId,
    c_ref: RefSize,
}

/// See [\[MS-ONESTORE\] 2.6.10](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/af821117-689f-42cf-8136-c72c1e238f1e)
#[derive(Debug, Parse)]
struct ObjectInfoDependencyOverrideData {
    c8_override_count: u32,
    c32_override_count: u32,
    crc: u32,
    #[parse_additional_args(c8_override_count as usize)]
    overrides1: Vec<ObjectInfoDependencyOverride<u8>>,
    #[parse_additional_args(c32_override_count as usize)]
    overrides2: Vec<ObjectInfoDependencyOverride<u32>>,
}

/// See [\[MS-ONESTORE\] 2.5.20](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/80125c83-199e-43b9-9a13-4085752eddac)
#[derive(Debug)]
struct ObjectInfoDependencyOverridesFND {
    obj_ref: FileNodeChunkReference,
    data: ObjectInfoDependencyOverrideData,
}

impl ParseWithFormat for ObjectInfoDependencyOverridesFND {
    fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        let obj_ref = FileNodeChunkReference::parse(reader, stp_format, cb_format)?;

        if obj_ref.is_fcr_nil() {
            let data =
                ObjectInfoDependencyOverrideData::parse(&mut obj_ref.resolve_to_reader(reader)?)?;
            Ok(Self { obj_ref, data })
        } else {
            Ok(Self {
                obj_ref,
                data: ObjectInfoDependencyOverrideData::parse(reader)?,
            })
        }
    }
}

/// Terminates ObjectGroupEndFND, DataSignatureGroupDefinitionFND, and RevisionManifestEndFND.
/// See [\[MS-ONESTORE\] 2.5.33](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/0fa4c886-011a-4c19-9651-9a69e43a19c6)
#[derive(Debug, Parse)]
struct DataSignatureGroupDefinitionFND {
    data_signature_group: ExGuid,
}

/// See [\[MS-ONESTORE\] 2.5.21](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/2701cc42-3601-49f9-a3ba-7c40cd8a2be9)
type FileDataStoreListReferenceFND = ObjectRefOnly;

/// See [\[MS-ONESTORE\] 2.5.22](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/6f6d5729-ad03-420f-b8fa-7683751218b3)
type FileDataStoreObjectReferenceFND = ObjectRefAndId<Guid>;

#[derive(Debug)]
struct ObjectDeclaration2Body {
    oid: CompactId,
    jcid: JcId,
    f_has_oid_references: bool,
    f_has_osid_references: bool,
}

impl Parse for ObjectDeclaration2Body {
    fn parse(reader: parser_utils::Reader) -> Result<Self> {
        let oid = CompactId::parse(reader)?;
        let jcid = JcId::parse(reader)?;
        let metadata = reader.get_u8()?;
        Ok(Self {
            oid,
            jcid,
            f_has_oid_references: metadata & 0x1 > 0,
            f_has_osid_references: metadata & 0x2 > 0,
        })
    }
}

/// See [\[MS-ONESTORE\] 2.5.25](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/a6ea1707-b205-4cd8-be40-d4c3462b226b)
#[derive(Debug)]
struct ObjectDeclaration2RefCount<RefSize: Parse> {
    blob_ref: FileNodeChunkReference,
    body: ObjectDeclaration2Body,
    c_ref: RefSize,
}

impl<RefSize: Parse> ParseWithFormat for ObjectDeclaration2RefCount<RefSize> {
    fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        Ok(Self {
            blob_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
            body: ObjectDeclaration2Body::parse(reader)?,
            c_ref: RefSize::parse(reader)?,
        })
    }
}

type ObjectDeclaration2RefCountFND = ObjectDeclaration2RefCount<u8>;
type ObjectDeclaration2LargeRefCountFND = ObjectDeclaration2RefCount<u32>;

type ObjectGroupListReferenceFND = ObjectRefAndId<ExGuid>;

#[derive(Debug, Parse)]
struct ObjectGroupStartFND {
    oid: ExGuid,
}

type HashedChunkDescriptor2FND = ObjectRefAndHash<u128>;

#[derive(Debug)]
struct ReadOnlyObjectDeclaration2RefCount<Base: ParseWithFormat> {
    base: Base,
    md5_hash: u128,
}

impl<Base: ParseWithFormat> ReadOnlyObjectDeclaration2RefCount<Base> {
    pub fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
        Ok(Self {
            base: Base::parse(reader, stp_format, cb_format)?,
            md5_hash: u128::parse(reader)?,
        })
    }
}

type ReadOnlyObjectDeclaration2RefCountFND =
    ReadOnlyObjectDeclaration2RefCount<ObjectDeclaration2RefCountFND>;
type ReadOnlyObjectDeclaration2LargeRefCountFND =
    ReadOnlyObjectDeclaration2RefCount<ObjectDeclaration2LargeRefCountFND>;
