use super::Reader;
use super::errors::Result;
pub use parser_macros::Parse;

pub trait Parse
where
    Self: Sized,
{
    fn parse(reader: Reader) -> Result<Self>;
}

impl Parse for u8 {
    fn parse(reader: Reader) -> Result<Self> {
        reader.get_u8()
    }
}

impl Parse for u16 {
    fn parse(reader: Reader) -> Result<Self> {
        reader.get_u16()
    }
}

impl Parse for u32 {
    fn parse(reader: Reader) -> Result<Self> {
        reader.get_u32()
    }
}

impl Parse for u64 {
    fn parse(reader: Reader) -> Result<Self> {
        reader.get_u64()
    }
}

impl Parse for f32 {
    fn parse(reader: Reader) -> Result<Self> {
        reader.get_f32()
    }
}

impl Parse for () {
    fn parse(_reader: Reader) -> Result<Self> {
        Ok(())
    }
}
