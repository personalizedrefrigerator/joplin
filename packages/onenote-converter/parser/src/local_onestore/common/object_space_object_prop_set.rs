
pub struct ObjectSpaceObjectPropSet {
	oids: ObjectSpaceObjectStreamOfOids,
	osids: ObjectSpaceObjectStreamOfOsids,
	context_ids: ObjectSpaceObjectStreamOfContextIds,
	body: PropertySet,
	padding: (),
}