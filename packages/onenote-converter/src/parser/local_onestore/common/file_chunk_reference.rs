use crate::parser::errors::Result;
use crate::parser::Reader;

trait FileChunkReference {
	fn is_fcr_nil(&self)->bool;
	fn is_fcr_zero(&self)->bool;
}

/// See [\[MS-ONESTORE\] 2.2.4.1](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/f77f021e-57b1-4dff-9254-985f514a0d89)
#[derive(Debug)]
pub struct FileChunkReference32 {
    /// Data location
	stp: u32,
    /// Data size
	cb: u32,
}

impl FileChunkReference32 {
	pub fn parse(reader: Reader)-> Result<FileChunkReference32> {
		Ok(Self {
			stp: reader.get_u32()?,
            cb: reader.get_u32()?,
		})
	}
}

impl FileChunkReference for FileChunkReference32 {
    fn is_fcr_nil(&self)->bool {
        self.stp == u32::MAX && self.cb == u32::MIN
    }

    fn is_fcr_zero(&self)->bool {
        self.stp == u32::MIN && self.cb == u32::MIN
    }
}


/// See [\[MS-ONESTORE\] 2.2.4.4]: https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/e2815e73-bd04-42fc-838e-6e86ab192e54
#[derive(Debug)]
pub struct FileChunkReference64x32 {
    stp: u64,
    cb: u32,
}

impl FileChunkReference64x32 {
	pub fn parse(reader: Reader)-> Result<Self> {
		Ok(Self {
			stp: reader.get_u64()?,
            cb: reader.get_u32()?,
		})
	}
}

impl FileChunkReference for FileChunkReference64x32 {
    fn is_fcr_nil(&self)->bool {
        self.stp == u64::MAX && self.cb == u32::MIN
    }

    fn is_fcr_zero(&self)->bool {
        self.stp == u64::MIN && self.cb == u32::MIN
    }
}



/// See [\[MS-ONESTORE\] 2.2.4.4]: https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/e2815e73-bd04-42fc-838e-6e86ab192e54
#[derive(Debug)]
pub struct FileChunkReference64 {
    stp: u64,
    cb: u64,
}

impl FileChunkReference64 {
	pub fn parse(reader: Reader)-> Result<Self> {
		Ok(Self {
			stp: reader.get_u64()?,
            cb: reader.get_u64()?,
		})
	}
}

impl FileChunkReference for FileChunkReference64 {
    fn is_fcr_nil(&self)->bool {
        self.stp == u64::MAX && self.cb == u64::MIN
    }

    fn is_fcr_zero(&self)->bool {
        self.stp == u64::MIN && self.cb == u64::MIN
    }
}
