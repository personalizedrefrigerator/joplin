use renderer::convert;
use std::fs;
use std::path::PathBuf;

fn setup(test_id: &str) -> PathBuf {
    let output_dir = PathBuf::from("./test-output").join(test_id);

    if output_dir.exists() {
        fs::remove_dir_all(&output_dir).unwrap();
    }
    fs::create_dir_all(&output_dir).unwrap();

    output_dir
}

#[test]
fn convert_web_export() {
    let output_dir = setup("web_export");

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
