use std::rc::Rc;

#[derive(Clone, Debug, Default, Eq, PartialEq, PartialOrd)]
pub struct FileBlob(pub Rc<Vec<u8>>);

impl FileBlob {
    pub fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

impl From<Vec<u8>> for FileBlob {
    fn from(value: Vec<u8>) -> Self {
        Self(Rc::new(value))
    }
}

impl From<&[u8]> for FileBlob {
    fn from(value: &[u8]) -> Self {
        Self(Rc::new(Vec::from(value)))
    }
}
