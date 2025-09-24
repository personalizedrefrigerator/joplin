pub use crate::parser::Parser;
use color_eyre::eyre::Result;
use std::panic;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::utils::{utils::log_warn, utils::log};
use crate::convert::convert;

mod convert;
mod notebook;
mod page;
mod parser;
mod section;
mod templates;
mod utils;

extern crate console_error_panic_hook;
extern crate web_sys;

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn oneNoteConverter(input: &str, output: &str, base_path: &str) {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    if let Err(e) = _main(input, output, base_path) {
        log_warn!("{:?}", e);
    }
}

fn _main(input_path: &str, output_dir: &str, base_path: &str) -> Result<()> {
    log!("Starting parsing of the file: {:?}", input_path);
    convert(&input_path, &output_dir, base_path)?;

    Ok(())
}
