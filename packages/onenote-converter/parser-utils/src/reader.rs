use crate::{FileHandle, errors::{ErrorKind, Result}};
use bytes::Buf;
use paste::paste;
use std::{io::{Read, Seek, SeekFrom}, mem};

macro_rules! try_get {
    ($this:ident, $typ:tt) => {{
        if $this.remaining() < mem::size_of::<$typ>() {
            Err(ErrorKind::UnexpectedEof(format!("Getting {:}", stringify!($typ)).into()).into())
        } else {
            let mut buff = $this.read(mem::size_of::<$typ>())?;
            let mut buff_ref: &[u8] = &mut buff;
            Ok(paste! {buff_ref. [< get_ $typ >]()})
        }
    }};

    ($this:ident, $typ:tt::$endian:tt) => {{
        if $this.remaining() < mem::size_of::<$typ>() {
            Err(ErrorKind::UnexpectedEof(
                format!("Getting {:} ({:})", stringify!($typ), stringify!($endian)).into(),
            )
            .into())
        } else {
            let mut buff = $this.read(mem::size_of::<$typ>())?;
            let mut buff_ref: &[u8] = &mut buff;
            Ok(paste! {buff_ref. [< get_ $typ _ $endian >]()})
        }
    }};
}

enum ReaderData<'a> {
    Buffer {
        buffer: Vec<u8>,
    },
    BufferRef {
        buffer: &'a [u8],
    },
    File(Box<dyn FileHandle>),
}

pub struct Reader<'a> {
    data: ReaderData<'a>,
    data_len: usize,
    data_offset: usize,
}

impl <'a> Seek for Reader<'a> {
    fn seek(&mut self, pos: SeekFrom) -> std::io::Result<u64> {
        if let ReaderData::File(f) = &mut self.data {
            self.data_offset = f.seek(pos)? as usize;
            return Ok(self.data_offset as u64);
        }

        let new_offset = match pos {
            SeekFrom::Start(n) => {
                n as i64
            },
            SeekFrom::Current(n) => {
                self.data_offset as i64 + n
            },
            SeekFrom::End(n) => {
                (self.data_len as i64) + n
            },
        };

        if new_offset < 0 || new_offset as usize >= self.data_len {
            Err(std::io::Error::new(std::io::ErrorKind::Unsupported, "out of bounds"))
        } else {
            self.data_offset = new_offset as usize;
            Ok(self.data_offset as u64)
        }
    }
}

impl <'a> Reader<'a> {
    pub fn new(buffer: &'a [u8]) -> Self {
        Reader {
            data_len: buffer.len(),
            data_offset: 0,
            data: ReaderData::BufferRef { buffer },
        }
    }

    pub fn read(&mut self, count: usize) -> Result<Vec<u8>> {
        if self.remaining() < count {
            return Err(ErrorKind::UnexpectedEof("Unexpected EOF (Reader.read)".into()).into());
        }

        let mut read_buffer = |buffer: &[u8]| {
            let vec = buffer[self.data_offset..self.data_offset + count].into();
            self.data_offset += count;
            Ok(vec)
        };

        match &mut self.data {
            ReaderData::Buffer { buffer, .. } => read_buffer(buffer),
            ReaderData::BufferRef { buffer } => read_buffer(buffer),
            ReaderData::File(file) => {
                let mut buff = vec![0; count];
                file.read_exact(&mut buff)?;
                Ok(buff)
            }
        }
    }

    pub fn peek_u8(&mut self) -> Option<u8> {
        match &mut self.data {
            ReaderData::Buffer { buffer, .. } => {
                buffer.get(0).copied()
            },
            ReaderData::BufferRef { buffer, .. } => {
                buffer.get(0).copied()
            },
            ReaderData::File(file) => {
                let mut buf = [0u8];
                match file.read(&mut buf) {
                    Ok(size) => if size < 1 {
                        None
                    } else {
                        Some(buf[0])
                    },
                    // TODO
                    Err(_error) => None
                }
            }
        }
    }

    pub fn remaining(&self) -> usize {
        self.data_len - self.data_offset
    }

    pub fn advance(&mut self, count: usize) -> Result<()> {
        if self.remaining() < count {
            return Err(ErrorKind::UnexpectedEof(
                format!(
                    "Reader.advance was unable to advance {} bytes. Only {} bytes are available",
                    count,
                    self.remaining(),
                )
                .into(),
            )
            .into());
        }

        self.data_offset += count;

        Ok(())
    }

    pub fn with_updated_bounds<'b>(&'b mut self, start: usize, end: usize) -> Result<Reader<'b>> {
        if start > self.data_len {
            return Err(ErrorKind::UnexpectedEof(
                "Reader.with_updated_bounds: start is out of bounds".into(),
            )
            .into());
        }
        if end > self.data_len {
            return Err(ErrorKind::UnexpectedEof(
                "Reader.with_updated_bounds: end is out of bounds".into(),
            )
            .into());
        }

        fn with_updated_buffer_ref_bounds<'b>(buffer: &'b [u8], start: usize, end: usize) -> Result<Reader<'b>> {
            Ok(Reader {
                data: ReaderData::BufferRef {
                    buffer: &buffer[start..end],
                },
                data_len: end - start,
                data_offset: 0,
            })
        }

        match &mut self.data {
            ReaderData::Buffer { buffer } => with_updated_buffer_ref_bounds(buffer, start, end),
            ReaderData::BufferRef { buffer } => with_updated_buffer_ref_bounds(buffer, start, end),
            ReaderData::File(file) => {
                let mut data = vec![0; end-start];
                file.read_exact(&mut data)?;
                file.seek_relative(-(data.len() as i64))?;

                Ok(Reader {
                    data: ReaderData::Buffer { buffer: data },
                    data_len: end - start,
                    data_offset: 0,                    
                })
            }
        }
    }

    pub fn get_u8(&mut self) -> Result<u8> {
        try_get!(self, u8)
    }

    pub fn get_u16(&mut self) -> Result<u16> {
        try_get!(self, u16::le)
    }

    pub fn get_u32(&mut self) -> Result<u32> {
        try_get!(self, u32::le)
    }

    pub fn get_u64(&mut self) -> Result<u64> {
        try_get!(self, u64::le)
    }

    pub fn get_u128(&mut self) -> Result<u128> {
        try_get!(self, u128::le)
    }

    pub fn get_f32(&mut self) -> Result<f32> {
        try_get!(self, f32::le)
    }
}

impl <'a> From<Box<dyn FileHandle>> for Reader<'a> {
    fn from(value: Box<dyn FileHandle>) -> Self {
        Self {
            data_len: value.byte_length(),
            data_offset: 0,
            data: ReaderData::File(value),
        }
    }
}

impl <'a> From<&'a [u8]> for Reader<'a> {
    fn from(value: &'a [u8]) -> Self {
        Self {
            data_len: value.len(),
            data_offset: 0,
            data: ReaderData::BufferRef { buffer: value },
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn with_start_index_should_seek() {
        let data: [u8; 8] = [1, 2, 3, 4, 5, 6, 7, 8];
        let mut reader = Reader::from(&data as &[u8]);
        assert_eq!(reader.get_u8().unwrap(), 1);
        assert_eq!(reader.get_u8().unwrap(), 2);
        assert_eq!(reader.get_u8().unwrap(), 3);
        {
            let mut reader = reader.with_updated_bounds(0, 8).unwrap();
            assert_eq!(reader.get_u8().unwrap(), 1);
            assert_eq!(reader.get_u8().unwrap(), 2);
            assert_eq!(reader.get_u8().unwrap(), 3);
            assert_eq!(reader.get_u8().unwrap(), 4);
            let mut reader = reader.with_updated_bounds(1, 7).unwrap();
            assert_eq!(reader.get_u8().unwrap(), 2);
            assert_eq!(reader.get_u8().unwrap(), 3);
            let mut reader = reader.with_updated_bounds(1, 7).unwrap();
            assert_eq!(reader.get_u8().unwrap(), 2);
            assert_eq!(reader.get_u8().unwrap(), 3);
            let mut reader = reader.with_updated_bounds(5, 7).unwrap();
            assert_eq!(reader.remaining(), 2);
            let reader = reader.with_updated_bounds(6, 6).unwrap();
            assert_eq!(reader.remaining(), 0);
        }
        assert_eq!(reader.get_u8().unwrap(), 4);
    }
}
