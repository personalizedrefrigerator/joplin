
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
use web_sys::js_sys::Uint8Array;
use super::FileApiDriver;
use color_eyre::Result;
use super::ApiResult;

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

pub struct FileApiDriverImpl { }

impl FileApiDriver for FileApiDriverImpl {
	fn is_directory(&self, path: &str) -> ApiResult<bool> {
		unsafe { is_directory(path.as_str()) }
	}

	fn read_dir(&self, path: &str) -> ApiResult<Vec<String>> {
		let result_ptr = unsafe { read_dir_js(path) }.unwrap();

		let result_str: String = match result_ptr.as_string() {
			Some(x) => x,
			_ => String::new(),
		};
		Ok(result_str.split('\n').map(|s| s.to_string()).collect_vec())
	}

	fn read_file(&self, path: &str) -> ApiResult<Vec<u8>> {
		let Ok(file) = (unsafe { read_file(path) }) else {
			return Err("Failed to read file.");
		};
		Uint8Array::new(&file).to_vec()
	}

	fn write_file(&self, path: &str, data: &[u8]) -> ApiResult<()> {
		unsafe { write_file(path, data) }?;
		Ok()
	}

	fn exists(&self, path: &str) -> bool {
		unsafe { exists(path) }
	}

	fn make_dir(&self, path: &str) -> ApiResult<()> {
		match unsafe { make_dir() } {
			Ok() => Ok(),
			Err(e) => std::io::Error::new(std::io::ErrorKind::Other, e.into()),
		}
	}

    fn get_file_name(&self, path: &str) -> Option<String> {
		let file_name = unsafe { get_file_name(path) }.unwrap().as_string().unwrap();
		if file_name == "" {
			None
		} else {
			file_name
		}
	}
    fn get_file_extension(&self, path: &str) -> String {
		unsafe { get_file_extension(path) }.unwrap().as_string().unwrap()
	}
    fn get_dir_name(&self, path: &str) -> String {
		unsafe { get_dir_name(path) }.unwrap().as_string().unwrap()
	}
    fn join(&self, path_1: &str, path_2: &str) -> String {
		unsafe { join_path(path_1, path_2) }.unwrap().as_string().unwrap()
	}
}
