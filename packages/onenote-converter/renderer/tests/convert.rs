use renderer::convert;
use std::fs;
use std::path::PathBuf;

struct TestResources {
    output_dir: PathBuf,
    test_data_dir: PathBuf,
}

fn setup(test_id: &str) -> TestResources {
    let output_dir = fs::canonicalize(
        PathBuf::from("./test-output").join(test_id)
    ).unwrap();

    if output_dir.exists() {
        fs::remove_dir_all(&output_dir).unwrap();
    }
    fs::create_dir_all(&output_dir).unwrap();

    let test_data_dir = fs::canonicalize(PathBuf::from("../test-data/")).unwrap();
    assert!(test_data_dir.exists());

    TestResources { output_dir, test_data_dir }
}

#[test]
fn convert_web_export() {
    let TestResources { output_dir, test_data_dir } = setup("web_export");
    let test_data_dir = test_data_dir.join("single-page");

    convert(
        &test_data_dir.join("Untitled Section.one").to_string_lossy(),
        &output_dir.to_string_lossy(),
        &test_data_dir.to_string_lossy(),
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
