use renderer::convert;
use std::fs;
use std::path::PathBuf;

fn get_output_dir() -> PathBuf {
    PathBuf::from("./test-output")
}

fn setup(test_id: &str) {
    let output_dir = get_output_dir().join(test_id);

    if output_dir.exists() {
        fs::remove_dir_all(&output_dir).unwrap();
    }
    fs::create_dir_all(&output_dir).unwrap();
}

#[test]
fn convert_web_export() {
    setup("web_export");

    let output_dir = get_output_dir();
    convert(
        "./assets/test-data/single-page/Untitled Section.one",
        &output_dir.to_string_lossy(),
        "./assets/test-data/single-page/",
    )
    .unwrap();

    // Should create a table of contents file
    assert!(output_dir.join("Untitled Section.html").exists());
    // Should convert the input page to an HTML file
    assert!(
        output_dir
            .join("Untitled Section")
            .join("test.html")
            .exists()
    );
}

