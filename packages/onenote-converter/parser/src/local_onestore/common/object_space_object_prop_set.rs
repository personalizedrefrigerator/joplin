use parser_utils::{parse::Parse, Reader, Result};

use crate::shared::compact_id::CompactId;

#[derive(Debug, Parse)]
pub struct ObjectSpaceObjectPropSet {
    oids: ObjectSpaceObjectStreamOfOids,
    osids: ObjectSpaceObjectStreamOfOsids,
    context_ids: ObjectSpaceObjectStreamOfContextIds,
    body: PropertySet,
    #[pad_to_alignment(8)]
    _padding: (),
}

#[derive(Debug, Parse)]
struct ObjectSpaceObjectStreamOfOids {
    header: ObjectSpaceObjectStreamHeader,
    #[parse_additional_args(&header)]
    body: ObjectSpaceObjectStreamOfIdsBody,
}

#[derive(Debug, Parse)]
#[validate(header.b_osid_stream_not_present == false)]
#[validate((body.ids.len() > 0) == header.a_has_addditional_streams)]
struct ObjectSpaceObjectStreamOfOsids {
    header: ObjectSpaceObjectStreamHeader,
    #[parse_additional_args(&header)]
    body: ObjectSpaceObjectStreamOfIdsBody,
}

/// See [\[MS-ONESTORE\] 2.6.5](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/34497a17-3623-4e1d-9488-a2e111a9a279)
#[derive(Debug)]
struct ObjectSpaceObjectStreamHeader {
    count: u32,
    a_has_addditional_streams: bool,
    b_osid_stream_not_present: bool,
}

impl Parse for ObjectSpaceObjectStreamHeader {
    fn parse(reader: Reader) -> Result<Self> {
        let data = reader.get_u32()?;
        Ok(Self {
            count: data >> 8,
            a_has_addditional_streams: data & 0x1 > 0,
            b_osid_stream_not_present: data & 0x2 > 0,
        })
    }
}

#[derive(Debug)]
struct ObjectSpaceObjectStreamOfIdsBody {
    ids: Vec<CompactId>,
}

impl ObjectSpaceObjectStreamOfIdsBody {
    pub fn parse(reader: Reader, header: &ObjectSpaceObjectStreamHeader) -> Result<Self> {
        let mut ids = Vec::new();
        for _i in 0..header.count {
            ids.push(CompactId::parse(reader)?);
        }

        Ok(Self { ids })
    }
}

#[derive(Debug, Parse)]
struct ObjectSpaceObjectStreamOfContextIds {}

#[derive(Debug, Parse)]
struct PropertySet {}
