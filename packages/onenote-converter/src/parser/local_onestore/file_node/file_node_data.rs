use crate::parser::shared::guid::Guid;

pub enum FileNodeData {
	ObjectSpaceManifestRootFND {
		gosid_root: Guid
	},
	ObjectSpaceManifestListReferenceFND {
		frag_ref: FileNodeChunkReference
	},
}

pub struct FileNodeData(u32);

#[allow(non_upper_case_globals)]
impl FileNodeId {
	const ObjectSpaceManifestRootFND: u32 = 0x004;
	const ObjectSpaceManifestListReferenceFND: u32 = 0x008;
	const ObjectSpaceManifestListStartFND: u32 = 0x00C;
	const RevisionManifestListReferenceFND: u32 = 0x010;
	const RevisionManifestListStartFND: u32 = 0x014;
	const RevisionManifestStart4FND: u32 = 0x01B;
	const RevisionManifestEndFND: u32 = 0x01C;
	const RevisionManifestStart6FND: u32 = 0x01E;
	const RevisionManifestStart7FND: u32 = 0x01F;
	const GlobalIdTableStartFNDX: u32 = 0x021;
	const GlobalIdTableStart2FND: u32 = 0x022;
	const GlobalIdTableEntryFNDX: u32 = 0x024;
	const GlobalIdTableEntry2FNDX: u32 = 0x025;
	const GlobalIdTableEntry3FNDX: u32 = 0x026;
	const GlobalIdTableEndFNDX: u32 = 0x028;
	const ObjectDeclarationWithRefCountFNDX: u32 = 0x02D;
	const ObjectDeclarationWithRefCount2FNDX: u32 = 0x02E;
	const ObjectRevisionWithRefCountFNDX: u32 = 0x041;
	const ObjectRevisionWithRefCount2FNDX: u32 = 0x042;
	const RootObjectReference2FNDX: u32 = 0x059;
	const RootObjectReference3FND: u32 = 0x05A;
	const RevisionRoleDeclarationFND: u32 = 0x05C;
	const RevisionRoleAndContextDeclarationFND: u32 = 0x05D;
	const ObjectDeclarationFileData3RefCountFND: u32 = 0x072;
	const ObjectDeclarationFileData3LargeRefCountFND: u32 = 0x073;
	const ObjectDataEncryptionKeyV2FNDX: u32 = 0x07C;
	const ObjectInfoDependencyOverridesFND: u32 = 0x084;
	const DataSignatureGroupDefinitionFND: u32 = 0x08C;
	const FileDataStoreListReferenceFND: u32 = 0x090;
	const FileDataStoreObjectReferenceFND: u32 = 0x094;
	const ObjectDeclaration2RefCountFND: u32 = 0x0A4;
	const ObjectDeclaration2LargeRefCountFND: u32 = 0x0A5;
	const ObjectGroupListReferenceFND: u32 = 0x0B0;
	const ObjectGroupStartFND: u32 = 0x0B4;
	const ObjectGroupEndFND: u32 = 0x0B8;
	const HashedChunkDescriptor2FND: u32 = 0x0C2;
	const ReadOnlyObjectDeclaration2RefCountFND: u32 = 0x0C4;
	const ReadOnlyObjectDeclaration2LargeRefCountFND: u32 = 0x0C5;
	const ChunkTerminatorFND: u32 = 0x0FF;

	pub fn to_node(&self)->Box<dyn BaseNode> {

	}
}
