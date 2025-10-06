//! Parsing specific to OneNote 2016 format `.one` and `.onetoc2` files.

mod common;
mod file_node;
mod file_structure;
mod objects;
mod one_store_file;

pub use one_store_file::OneStoreFile;
