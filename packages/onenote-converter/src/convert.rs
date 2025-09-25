use color_eyre::eyre::eyre;
use crate::utils::get_fs_driver;
use crate::utils::utils::log;
use color_eyre::eyre::Result;
use crate::Parser;
use crate::section;
use crate::notebook;

pub fn convert(path: &str, output_dir: &str, base_path: &str) -> Result<()> {
    let mut parser = Parser::new();

    let extension: String = get_fs_driver().get_file_extension(path);

    match extension.as_str() {
        ".one" => {
            let name: String = get_fs_driver().get_file_name(path).expect("Missing file name");
            log!("Parsing .one file: {}", name);

            if path.contains("OneNote_RecycleBin") {
                return Ok(());
            }

            let section = parser.parse_section(path.to_owned())?;

            let section_output_dir = get_fs_driver().get_output_path(base_path, output_dir, path);
            section::Renderer::new().render(&section, section_output_dir.to_owned())?;
        }
        ".onetoc2" => {
            let name: String = get_fs_driver().get_file_name(path).expect("Missing file name");
            log!("Parsing .onetoc2 file: {}", name);

            let notebook = parser.parse_notebook(path.to_owned())?;

            let notebook_name = get_fs_driver().get_parent_dir(path)
                .expect("Input file has no parent folder");
			if notebook_name == "" {
				panic!("Parent directory has no name");
			}
            log!("notebook name: {:?}", notebook_name);

            let notebook_output_dir = get_fs_driver().get_output_path(base_path, output_dir, path);
            log!("Notebok directory: {:?}", notebook_output_dir);

            notebook::Renderer::new().render(&notebook, &notebook_name, &notebook_output_dir)?;
        }
        ext => return Err(eyre!("Invalid file extension: {}, file: {}", ext, path)),
    }

    Ok(())
}

#[cfg(test)]
mod test {
	use super::*;
    use std::fs;

    fn setup() {
        if fs::exists("./test-output").unwrap() {
            fs::remove_dir_all("./test-output").unwrap();
        }
        fs::create_dir("./test-output").unwrap();
    }

    #[test]
    fn convert_simple() {
        setup();
		convert(
			"./assets/test-data/single-page/Untitled Section.one",
			"./test-output/",
			"./assets/test-data/single-page/"
		).unwrap()
    }
}
