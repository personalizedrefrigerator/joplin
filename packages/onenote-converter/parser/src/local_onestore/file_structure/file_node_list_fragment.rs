use crate::local_onestore::{common::FileChunkReference64x32, file_node::FileNodeData};
use parser_utils::{errors::ErrorKind, parse::Parse};

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct FileNodeListFragment {
    pub header: FileNodeListHeader,
    pub file_nodes: Vec<FileNodeData>,
    pub next_fragment: FileChunkReference64x32,
    pub footer: u64,
}

impl FileNodeListFragment {
    pub fn parse(reader: parser_utils::Reader, size: usize) -> parser_utils::Result<Self> {
        let header = FileNodeListHeader::parse(reader)?;
        let mut file_nodes: Vec<FileNodeData> = Vec::new();
        let mut file_node_size: usize = 0;

        let remaining_0 = reader.remaining();

        println!("Frag: Size: {}", size);

        loop {
            let file_node = FileNodeData::parse(reader)?;
            file_node_size += file_node.size as usize;
            println!("Node {:#0x}, remaining {}", file_node.node_id, size - 36 - file_node_size);

            if file_node.node_id != 0 {
                file_nodes.push(file_node);
            }

            assert_eq!(remaining_0 - reader.remaining(), file_node_size);

            if size - 36 - file_node_size <= 4 {
                break;
            }
        }

        let padding_length = size - 36 - file_node_size;
        reader.advance(padding_length)?;

        let next_fragment = FileChunkReference64x32::parse(reader)?;

        let footer = reader.get_u64()?;
        if footer != 0x8BC215C38233BA4B {
            return Err(
                ErrorKind::MalformedOneStoreData(
                    format!("Invalid footer: {:#0x}", footer).into()
                ).into()
            );
        }

        Ok(Self {
            header,
            file_nodes,
            next_fragment,
            footer,
        })
    }
}

#[derive(Debug, Parse, Clone)]
#[validate(magic == 0xA4567AB1F5F7F4C4)]
#[validate(file_node_list_id >= 0x0010)]
#[allow(dead_code)]
pub struct FileNodeListHeader {
    magic: u64,
    file_node_list_id: u32,
    pub n_fragment_sequence: u32,
}
