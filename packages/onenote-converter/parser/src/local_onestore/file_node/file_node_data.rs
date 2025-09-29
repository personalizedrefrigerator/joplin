use parser_utils::parse::Parse;
use parser_utils::Result;
use super::file_node_chunk_reference::FileNodeChunkReference;
use super::super::common::ObjectDeclarationWithRefCountBody;
use crate::shared::exguid::ExGuid;

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
		let node_id = first_line >> 22; // First 10 bits
		let size = (first_line >> 9) & 0x1FFF; // Next 13 bits
		let stp_format = (first_line >> 7) & 0x3; // Next 3 bits
		let cb_format = (first_line >> 5) & 0x3; // Next 3 bits
		let base_type = (first_line >> 1) & 0xF;

		let fnd = match node_id {
			0x004 => FileNode::ObjectSpaceManifestRootFND(ObjectSpaceManifestRootFND::parse(reader)?),
			0x008 => FileNode::ObjectSpaceManifestListReferenceFND(ObjectSpaceManifestListReferenceFND::parse(reader, stp_format, cb_format)?),
			0x00C => FileNode::ObjectSpaceManifestListStartFND(ObjectSpaceManifestListStartFND::parse(reader)?),
			0x010 => FileNode::RevisionManifestListReferenceFND(RevisionManifestListReferenceFND::parse(reader, stp_format, cb_format)?),
			0x014 => FileNode::RevisionManifestListStartFND(RevisionManifestListStartFND::parse(reader)?),
			0x01B => FileNode::RevisionManifestStart4FND(RevisionManifestStart4FND::parse(reader)?),
			// 0x01C => RevisionManifestEndFND // Unused
			0x01E => FileNode::RevisionManifestStart6FND(RevisionManifestStart6FND::parse(reader)?),
			0x01F => FileNode::RevisionManifestStart7FND(RevisionManifestStart7FND::parse(reader)?),
			0x021 => FileNode::GlobalIdTableStartFNDX(GlobalIdTableStartFNDX::parse(reader)?),
			// 0x022 => GlobalIdTableStart2FND// Unused
			0x024 => FileNode::GlobalIdTableEntryFNDX(GlobalIdTableEntryFNDX::parse(reader)?),
			0x025 => FileNode::GlobalIdTableEntry2FNDX(GlobalIdTableEntry2FNDX::parse(reader)?),
			0x026 => FileNode::GlobalIdTableEntry3FNDX(GlobalIdTableEntry3FNDX::parse(reader)?),
			// 0x028 => GlobalIdTableEndFNDX // Unused
			// 0x02D => Self::ObjectDeclarationWithRefCountFNDX(ObjectDeclarationWithRefCountFNDX::parse(reader)?),
			// 0x02E => Self::ObjectDeclarationWithRefCount2FNDX(ObjectDeclarationWithRefCount2FNDX::parse(reader)?),
			// 0x041 => Self::ObjectRevisionWithRefCountFNDX(ObjectRevisionWithRefCountFNDX::parse(reader)?),
			// 0x042 => Self::ObjectRevisionWithRefCount2FNDX(ObjectRevisionWithRefCount2FNDX::parse(reader)?),
			// 0x059 => Self::RootObjectReference2FNDX(RootObjectReference2FNDX::parse(reader)?),
			// 0x05A => Self::RootObjectReference3FND(RootObjectReference3FND::parse(reader)?),
			// 0x05C => Self::RevisionRoleDeclarationFND(RevisionRoleDeclarationFND::parse(reader)?),
			// 0x05D => Self::RevisionRoleAndContextDeclarationFND(RevisionRoleAndContextDeclarationFND::parse(reader)?),
			// 0x072 => Self::ObjectDeclarationFileData3RefCountFND(ObjectDeclarationFileData3RefCountFND::parse(reader)?),
			// 0x073 => Self::ObjectDeclarationFileData3LargeRefCountFND(ObjectDeclarationFileData3LargeRefCountFND::parse(reader)?),
			// 0x07C => Self::ObjectDataEncryptionKeyV2FNDX(ObjectDataEncryptionKeyV2FNDX::parse(reader)?),
			// 0x084 => Self::ObjectInfoDependencyOverridesFND(ObjectInfoDependencyOverridesFND::parse(reader)?),
			// 0x08C => Self::DataSignatureGroupDefinitionFND(DataSignatureGroupDefinitionFND::parse(reader)?),
			// 0x090 => Self::FileDataStoreListReferenceFND(FileDataStoreListReferenceFND::parse(reader)?),
			// 0x094 => Self::FileDataStoreObjectReferenceFND(FileDataStoreObjectReferenceFND::parse(reader)?),
			// 0x0A4 => Self::ObjectDeclaration2RefCountFND(ObjectDeclaration2RefCountFND::parse(reader)?),
			// 0x0A5 => Self::ObjectDeclaration2LargeRefCountFND(ObjectDeclaration2LargeRefCountFND::parse(reader)?),
			// 0x0B0 => Self::ObjectGroupListReferenceFND(ObjectGroupListReferenceFND::parse(reader)?),
			// 0x0B4 => Self::ObjectGroupStartFND(ObjectGroupStartFND::parse(reader)?),
			// 0x0B8 => Self::ObjectGroupEndFND(ObjectGroupEndFND::parse(reader)?),
			// 0x0C2 => Self::HashedChunkDescriptor2FND(HashedChunkDescriptor2FND::parse(reader)?),
			// 0x0C4 => Self::ReadOnlyObjectDeclaration2RefCountFND(ReadOnlyObjectDeclaration2RefCountFND::parse(reader)?),
			// 0x0C5 => Self::ReadOnlyObjectDeclaration2LargeRefCountFND(ReadOnlyObjectDeclaration2LargeRefCountFND::parse(reader)?),
			// 0x0FF => Self::ChunkTerminatorFND(ChunkTerminatorFND::parse(reader)?),
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
pub enum FileNode {
	ObjectSpaceManifestRootFND(ObjectSpaceManifestRootFND),
	ObjectSpaceManifestListReferenceFND(ObjectSpaceManifestListReferenceFND),
	ObjectSpaceManifestListStartFND(ObjectSpaceManifestListStartFND),
	RevisionManifestListReferenceFND(RevisionManifestListReferenceFND),
	RevisionManifestListStartFND(RevisionManifestListStartFND),
	RevisionManifestStart4FND(RevisionManifestStart4FND),
	RevisionManifestStart6FND(RevisionManifestStart6FND),
	RevisionManifestStart7FND(RevisionManifestStart7FND),
	GlobalIdTableStartFNDX(GlobalIdTableStartFNDX),
	GlobalIdTableEntryFNDX(GlobalIdTableEntryFNDX),
	GlobalIdTableEntry2FNDX(GlobalIdTableEntry2FNDX),
	GlobalIdTableEntry3FNDX(GlobalIdTableEntry3FNDX),
	ObjectDeclarationWithRefCountFNDX(ObjectDeclarationWithRefCountFNDX),
	Null,
}

#[derive(Debug, Parse)]
struct ObjectSpaceManifestRootFND {
	gosid_root: Guid
}

#[derive(Debug)]
struct ObjectSpaceManifestListReferenceFND {
	frag_ref: FileNodeChunkReference,
	gsoid: ExGuid,
}

impl ObjectSpaceManifestListReferenceFND {
	pub fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
		Ok(Self {
			frag_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
			gsoid: ExGuid::parse(reader)?,
		})
	}
}

#[derive(Debug, Parse)]
struct ObjectSpaceManifestListStartFND {
	gsoid: ExGuid,
}

#[derive(Debug)]
struct RevisionManifestListReferenceFND {
	list_ref: FileNodeChunkReference,
}

impl RevisionManifestListReferenceFND {
	pub fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
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
struct ObjectDeclarationWithRefCountFNDX {
	object_ref: FileNodeChunkReference,
	body: ObjectDeclarationWithRefCountBody,
	c_ref: u8,
	property_set: ObjectSpaceObjectPropSet,
}

impl ObjectDeclarationWithRefCountFNDX {
	fn parse(reader: parser_utils::Reader, stp_format: u32, cb_format: u32) -> Result<Self> {
		Ok(Self {
			object_ref: FileNodeChunkReference::parse(reader, stp_format, cb_format)?,
			body: ObjectDeclarationWithRefCountBody::parse(reader)?,
			c_ref: reader.get_u8()?,
			property_set: ObjectSpaceObjectPropSet::parse(reader)?,
		})
	}
}
