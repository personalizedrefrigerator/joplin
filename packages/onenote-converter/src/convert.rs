use crate::notebook;
use crate::section;
use crate::utils::fs_driver;
use crate::utils::utils::log;
use crate::Parser;
use color_eyre::eyre::eyre;
use color_eyre::eyre::Result;

pub fn convert(path: &str, output_dir: &str, base_path: &str) -> Result<()> {
    let mut parser = Parser::new();

    let extension: String = fs_driver().get_file_extension(path);

    match extension.as_str() {
        ".one" => {
            let name: String = fs_driver().get_file_name(path).expect("Missing file name");
            log!("Parsing .one file: {}", name);

            if path.contains("OneNote_RecycleBin") {
                return Ok(());
            }

            let section = parser.parse_section(path.to_owned())?;

            let section_output_dir = fs_driver().get_output_path(base_path, output_dir, path);
            section::Renderer::new().render(&section, section_output_dir.to_owned())?;
        }
        ".onetoc2" => {
            let name: String = fs_driver().get_file_name(path).expect("Missing file name");
            log!("Parsing .onetoc2 file: {}", name);

            let notebook = parser.parse_notebook(path.to_owned())?;

            let notebook_name = fs_driver()
                .get_parent_dir(path)
                .expect("Input file has no parent folder");
            if notebook_name == "" {
                panic!("Parent directory has no name");
            }
            log!("notebook name: {:?}", notebook_name);

            let notebook_output_dir = fs_driver().get_output_path(base_path, output_dir, path);
            log!("Notebok directory: {:?}", notebook_output_dir);

            notebook::Renderer::new().render(&notebook, &notebook_name, &notebook_output_dir)?;
        }
        ext => return Err(eyre!("Invalid file extension: {}, file: {}", ext, path)),
    }

    Ok(())
}
