use parser_utils::parse::Parse;

#[derive(Debug, Parse)]
pub struct ObjectSpaceObjectPropSet {
	oids: ObjectSpaceObjectStreamOfOids,
	osids: ObjectSpaceObjectStreamOfOsids,
	context_ids: ObjectSpaceObjectStreamOfContextIds,
	body: PropertySet,
	#[pad_to_alignment(8)]
	padding: (),
}

#[derive(Debug, Parse)]
struct ObjectSpaceObjectStreamOfOids {

}

#[derive(Debug, Parse)]
struct ObjectSpaceObjectStreamOfOsids {

}

#[derive(Debug, Parse)]
struct ObjectSpaceObjectStreamOfContextIds {

}

#[derive(Debug, Parse)]
struct PropertySet {

}