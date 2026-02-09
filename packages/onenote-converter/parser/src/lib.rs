//! A OneNote file parser.
//!
//! `onenote_parser` provides a high-level API to parse OneNote notebooks and
//! inspect sections, pages, and their contents. It implements the underlying
//! OneNote file format layers (FSSHTTPB, OneStore, and MS-ONE) and exposes a
//! stable surface for consumers through the [`Parser`] type.
//!
//! The parser supports OneNote files from both OneDrive downloads (FSSHTTP
//! packaging) and desktop OneNote applications (2016, 2019, LTSC, etc.).
//! It is **read-only** and does _not_ support writing or modifying OneNote files.
//!
//! # Usage
//!
//! ```no_run
//! use onenote_parser::Parser;
//! use std::path::Path;
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let mut parser = Parser::new();
//! let notebook = parser.parse_notebook(Path::new("My Notebook.onetoc2"))?;
//! println!("sections: {}", notebook.entries().len());
//! # Ok(())
//! # }
//! ```
//!
//! # Features
//!
//! - `backtrace`: Captures a `std::backtrace::Backtrace` on parse errors and
//!   exposes it via `std::error::Error::backtrace()`.
//!
//! # Architecture
//!
//! The code organization and architecture follows the OneNote file format which is
//! built from several layers of encodings:
//!
//! - `fsshttpb/`: This implements the FSSHTTP binary packaging format as specified
//! in [\[MS-FSSHTTPB\]: Binary Requests for File Synchronization via SOAP Protocol].
//! This is the packaging format used for files downloaded from OneDrive.
//! - `onestore/`: This implements the OneStore format as specified in
//! [\[MS-ONESTORE\]: OneNote Revision Store File Format]. This layer handles the
//! revision store containing all OneNote objects. It supports both the desktop
//! file format (where the revision store is the file itself) and the FSSHTTP
//! format (where the store is built from objects and revisions inside the package).
//! - `one/`: This implements the OneNote file format as specified in [\[MS-ONE\]:
//! OneNote File Format]. This specifies how objects in a OneNote file are parsed
//! from a OneStore revision file.
//! - `onenote/`: high-level API that resolves references between objects
//!
//! # Error handling
//!
//! Most fallible APIs return [`errors::Result`], which wraps an [`errors::Error`]
//! containing an error kind. You can format the error for user-facing messages
//! and (with the `backtrace` feature enabled) access the captured backtrace via
//! `std::error::Error::backtrace()`.
//!
//! # Input files
//!
//! The parser supports the following OneNote file formats:
//!
//! - **`.one`** – Section files containing the actual notes and content.
//! - **`.onetoc2`** – Table of contents files used to organize sections within a notebook.
//!
//! These files can be obtained from:
//! - **OneNote Desktop** (2016, 2019, LTSC, etc.)
//! - **OneDrive** (via the "Download Notebook" feature)
//! - **OneNote for Windows 10/11** (via `.one` export)
//! - **OneNote for Mac** (as backup files)
//!
//! # Stability
//!
//! The public API follows semantic versioning and is intended to be stable.
//!
//! **Minimum Supported Rust Version (MSRV):** 1.85
//!
//! # References
//!
//! - [\[MS-ONESTORE\]: OneNote Revision Store File Format]
//! - [\[MS-ONE\]: OneNote File Format]
//! - [\[MS-FSSHTTPB\]: Binary Requests for File Synchronization via SOAP Protocol]
//!
//! [\[MS-ONESTORE\]: OneNote Revision Store File Format]: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/ae670cd2-4b38-4b24-82d1-87cfb2cc3725
//! [\[MS-ONE\]: OneNote File Format]: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-one/73d22548-a613-4350-8c23-07d15576be50
//! [\[MS-FSSHTTPB\]: Binary Requests for File Synchronization via SOAP Protocol]: https://docs.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttpb/f59fc37d-2232-4b14-baac-25f98e9e7b5a

#![warn(missing_docs)]
#![deny(unused_must_use)]
#![cfg_attr(feature = "backtrace", feature(error_generic_member_access))]

#[macro_use]
mod macros;

pub mod errors;
mod fsshttpb;
mod one;
mod onenote;
mod onestore;
mod reader;
mod shared;
mod utils;

pub(crate) type Reader<'a, 'b> = &'b mut reader::Reader<'a>;

pub use crate::onenote::Parser;

/// The data that represents a OneNote notebook.
pub mod notebook {
    pub use crate::onenote::notebook::Notebook;
}

/// The data that represents a OneNote section.
pub mod section {
    pub use crate::onenote::section::{Section, SectionEntry, SectionGroup};
}

/// The data that represents a OneNote page.
pub mod page {
    pub use crate::onenote::page::{Page, Title};
    pub use crate::onenote::page_content::PageContent;
    pub use crate::onenote::page_series::PageSeries;
}

/// The data that represents the contents of a OneNote section.
pub mod contents {
    pub use crate::onenote::content::Content;
    pub use crate::onenote::embedded_file::EmbeddedFile;
    pub use crate::onenote::image::Image;
    pub use crate::onenote::ink::{Ink, InkBoundingBox, InkPoint, InkStroke};
    pub use crate::onenote::list::List;
    pub use crate::onenote::math_inline_object::{MathInlineObject, MathObjectType};
    pub use crate::onenote::note_tag::NoteTag;
    pub use crate::onenote::outline::{Outline, OutlineElement, OutlineGroup, OutlineItem};
    pub use crate::onenote::rich_text::{
        EmbeddedInkContainer, EmbeddedInkSpace, EmbeddedObject, ParagraphStyling, RichText,
    };
    pub use crate::onenote::table::{Table, TableCell, TableRow};
}

/// Collection of properties used by the OneNote file format.
pub mod property {
    /// Properties related to multiple types of objects.
    pub mod common {
        pub use crate::one::property::color::Color;
        pub use crate::one::property::color_ref::ColorRef;
    }

    /// Properties related to embedded files.
    pub mod embedded_file {
        pub use crate::one::property::file_type::FileType;
    }

    /// Properties related to note tags.
    pub mod note_tag {
        pub use crate::one::property::note_tag::{ActionItemStatus, ActionItemType};
        pub use crate::one::property::note_tag_property_status::NoteTagPropertyStatus;
        pub use crate::one::property::note_tag_shape::NoteTagShape;
        pub use crate::onenote::note_tag::NoteTagDefinition;
    }

    /// Properties related to rich-text content.
    pub mod rich_text {
        pub use crate::one::property::charset::Charset;
        pub use crate::one::property::paragraph_alignment::ParagraphAlignment;
        pub use crate::onenote::rich_text::ParagraphStyling;
        pub use crate::onenote::text_region::Hyperlink;
        pub use crate::onenote::text_region::MathExpression;
        pub use crate::onenote::text_region::TextRegion;
    }
}
