use crate::errors::{ErrorKind, Result};
use bytes::Buf;
use paste::paste;
use std::mem;

macro_rules! try_get {
    ($this:ident, $typ:tt) => {{
        if $this.buff.remaining() < mem::size_of::<$typ>() {
            Err(ErrorKind::UnexpectedEof.into())
        } else {
            Ok(paste! {$this.buff. [< get_ $typ >]()})
        }
    }};

    ($this:ident, $typ:tt::$endian:tt) => {{
        if $this.buff.remaining() < mem::size_of::<$typ>() {
            Err(ErrorKind::UnexpectedEof.into())
        } else {
            Ok(paste! {$this.buff. [< get_ $typ _ $endian >]()})
        }
    }};
}

pub struct Reader<'a> {
    buff: &'a [u8],
    original: &'a [u8],
}

impl<'a> Reader<'a> {
    pub fn new(data: &'a [u8]) -> Reader<'a> {
        Reader {
            buff: data,
            original: data,
        }
    }

    pub fn read(&mut self, cnt: usize) -> Result<&[u8]> {
        if self.remaining() < cnt {
            return Err(ErrorKind::UnexpectedEof.into());
        }

        let data = &self.buff[0..cnt];
        self.buff.advance(cnt);

        Ok(data)
    }

    pub fn bytes(&self) -> &[u8] {
        self.buff.chunk()
    }

    pub fn remaining(&self) -> usize {
        self.buff.remaining()
    }

    pub fn advance(&mut self, cnt: usize) -> Result<()> {
        if self.remaining() < cnt {
            return Err(ErrorKind::UnexpectedEof.into());
        }

        self.buff.advance(cnt);

        Ok(())
    }

    pub fn with_start_index(&self, position: usize) -> Result<Reader<'a>> {
        if position >= self.original.len() {
            return Err(ErrorKind::UnexpectedEof.into());
        }

        Ok(Reader::new(&self.original[position..]))
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
