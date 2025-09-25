use super::ApiResult;
use super::FileApiDriver;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
use web_sys::js_sys;
use web_sys::js_sys::Uint8Array;

#[wasm_bindgen(module = "/node_functions.js")]
extern "C" {
    #[wasm_bindgen(js_name = mkdirSyncRecursive, catch)]
    unsafe fn make_dir(path: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = pathSep, catch)]
    unsafe fn path_sep() -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = removePrefix, catch)]
    unsafe fn remove_prefix(
        base_path: String,
        prefix: &str,
    ) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = getOutputPath, catch)]
    unsafe fn get_output_path(
        input_dir: &str,
        output_dir: &str,
        file_path: &str,
    ) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = normalizeAndWriteFile, catch)]
    unsafe fn write_file(path: &str, data: &[u8]) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = isDirectory, catch)]
    unsafe fn is_directory(path: &str) -> std::result::Result<bool, JsValue>;

    #[wasm_bindgen(js_name = readDir, catch)]
    unsafe fn read_dir_js(path: &str) -> std::result::Result<JsValue, JsValue>;
}

#[wasm_bindgen(module = "fs")]
extern "C" {
    // #[wasm_bindgen(js_name = writeFileSync, catch)]
    // pub unsafe fn write_file(path: &str, data: &[u8]) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = readFileSync, catch)]
    unsafe fn read_file(path: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = existsSync, catch)]
    unsafe fn exists(path: &str) -> std::result::Result<bool, JsValue>;
}

#[wasm_bindgen(module = "path")]
extern "C" {
    #[wasm_bindgen(js_name = basename, catch)]
    unsafe fn get_file_name(path: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = extname, catch)]
    unsafe fn get_file_extension(path: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = dirname, catch)]
    unsafe fn get_dir_name(path: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(js_name = join, catch)]
    unsafe fn join_path(path_1: &str, path_2: &str) -> std::result::Result<JsValue, JsValue>;
}

fn handle_error(error: JsValue, source: &str) -> std::io::Error {
    use std::io::Error;
    use std::io::ErrorKind;

    let error = js_sys::Error::from(error);
    match error.name().to_string() {
        _ => Error::new(
            ErrorKind::Other,
            String::from(format!("Err({}): {:?}", source, error)),
        ),
    }
}

pub struct FileApiDriverImpl {}

impl FileApiDriver for FileApiDriverImpl {
    fn is_directory(&self, path: &str) -> ApiResult<bool> {
        match unsafe { is_directory(path) } {
            Ok(is_dir) => Ok(is_dir),
            Err(e) => Err(handle_error(e, "checking is_directory")),
        }
    }

    fn read_dir(&self, path: &str) -> ApiResult<Vec<String>> {
        let result_ptr = unsafe { read_dir_js(path) }.unwrap();

        let result_str: String = match result_ptr.as_string() {
            Some(x) => x,
            _ => String::new(),
        };
        Ok(result_str.split('\n').map(|s| s.to_string()).collect())
    }

    fn read_file(&self, path: &str) -> ApiResult<Vec<u8>> {
        match unsafe { read_file(path) } {
            Ok(file) => Ok(Uint8Array::new(&file).to_vec()),
            Err(e) => Err(handle_error(e, &format!("reading file {}", path))),
        }
    }

    fn write_file(&self, path: &str, data: &[u8]) -> ApiResult<()> {
        if let Err(error) = unsafe { write_file(path, data) } {
            Err(handle_error(error, &format!("writing file {}", path)))
        } else {
            Ok(())
        }
    }

    fn exists(&self, path: &str) -> ApiResult<bool> {
        match unsafe { exists(path) } {
            Ok(exists) => Ok(exists),
            Err(e) => Err(handle_error(e, &format!("checking exists {}", path))),
        }
    }

    fn make_dir(&self, path: &str) -> ApiResult<()> {
        if let Err(error) = unsafe { make_dir(path) } {
            Err(handle_error(error, &format!("mkdir {}", path)))
        } else {
            Ok(())
        }
    }

    fn get_file_name(&self, path: &str) -> Option<String> {
        let file_name = unsafe { get_file_name(path) }.unwrap().as_string().unwrap();
        if file_name == "" {
            None
        } else {
            Some(file_name)
        }
    }
    fn get_file_extension(&self, path: &str) -> String {
        unsafe { get_file_extension(path) }
            .unwrap()
            .as_string()
            .unwrap()
    }
    fn get_dir_name(&self, path: &str) -> String {
        unsafe { get_dir_name(path) }.unwrap().as_string().unwrap()
    }
    fn join(&self, path_1: &str, path_2: &str) -> String {
        unsafe { join_path(path_1, path_2) }
            .unwrap()
            .as_string()
            .unwrap()
    }
}
