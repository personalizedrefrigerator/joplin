import XCTest

final class JoplinUITests: XCTestCase {

  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  override func tearDownWithError() throws {
  }
  
  // Creates a test profile and runs the given callback within it, deleting the
  // profile after the test completes.
  //
  // This allows running a test in a clean environment. By default, XCode UI tests re-use existing profiles.
  func runWithTemporaryProfile(runTest: (_: XCUIApplication) throws -> ()) throws {
    let app = XCUIApplication()
    app.launch()
    app.activate()
    
    let mainScreen = MainScreen()
    mainScreen.waitFor(app: app)

    let sidebar = mainScreen.openSidebar(app: app)
    let settings = sidebar.openSettings(app: app)
    let profileManager = settings.openProfileManager(app: app)
    
    let profileName = "Test-\(Date.timeIntervalSinceReferenceDate)"
    profileManager.newProfile(app: app, name: profileName)
    profileManager.openProfile(app: app, name: profileName)
    
    defer {
      // Try to navigate back to the main screen
      let backButton = app.buttons["Back"]
      while backButton.waitForExistence(timeout: 2.0) {
        backButton.firstMatch.tap()
      }
      
      // Switch back to the default profile: The active profile can't be deleted
      let profiles1 = mainScreen.openProfileManager(app: app)
      profiles1.openProfile(app: app, name: "Default")
      
      // Clean up the temporary test profile
      mainScreen.waitFor(app: app)
      let profiles2 = mainScreen.openProfileManager(app: app)
      profiles2.deleteProfile(app: app, name: profileName)
    }
    
    try runTest(app)
  }

  @MainActor
  func testCreateNote() throws {
    try runWithTemporaryProfile { (app) throws -> () in
      let mainScreen = MainScreen()
      mainScreen.waitFor(app: app)
      mainScreen.newFolder(app: app, name: "Test!")
      
      app.buttons["Add new"].tap()
      app.buttons["󰧮, New note"].firstMatch.tap()
      
      // Should be able to fill the note body
      let markdownEditor = app.textViews["Markdown editor"].firstMatch
      markdownEditor.tap()
      markdownEditor.typeText("This is some text in the note body.")
      
      let stopEditing = app.buttons["Stop editing"].firstMatch
      stopEditing.tap()
      
      // Should render
      let noteBodyText = app.staticTexts["This is some text in the note body."]
      let rendered = noteBodyText.waitForExistence(timeout: 60.0)
      assert(rendered == true)
      
      app.buttons["Back"].firstMatch.tap()
    }
  }
}


class MainScreen {
  private func sidebarToggle(_ app: XCUIApplication) -> XCUIElement {
    return app.buttons["Sidebar"]
  }

  func waitFor(app: XCUIApplication) {
    if !sidebarToggle(app).waitForExistence(timeout: 30.0) {
      assertionFailure("Failed to find the sidebar toggle")
    }
  }

  func openSidebar(app: XCUIApplication) -> SidebarScreen {
    sidebarToggle(app).firstMatch.tap()
    return SidebarScreen()
  }
  
  func newFolder(app: XCUIApplication, name: String) {
    let _ = openSidebar(app: app)
    app.buttons[", New Notebook"].firstMatch.tap()
    app.textFields["Enter notebook title"].firstMatch.tap()
    app.textFields["Enter notebook title"].firstMatch.typeText(name)
    app.buttons["Save changes"].firstMatch.tap()
  }
  
  func openProfileManager(app: XCUIApplication) -> ProfileScreen {
    let sidebar = openSidebar(app: app)
    let settings = sidebar.openSettings(app: app)
    return settings.openProfileManager(app: app)
  }
}

class SidebarScreen {
  func openSettings(app: XCUIApplication) -> SettingsScreen {
    let configButton = app.buttons.element(matching: NSPredicate(format: "label LIKE \"*Configuration\""))
    configButton.firstMatch.tap()
    
    return SettingsScreen()
  }
}

class SettingsScreen {
  func openProfileManager(app: XCUIApplication) -> ProfileScreen {
    let toolsSection = app.otherElements.element(matching: NSPredicate(format: "label LIKE \"*Tools, Logs, profiles*\""))
    toolsSection.firstMatch.tap()
    
    app.buttons["Manage profiles"].firstMatch.tap()
    
    return ProfileScreen()
  }
}

class ProfileScreen {
  func newProfile(app: XCUIApplication, name: String) {
    // Should open the "new profile" editor:
    app.otherElements["fab-content"].firstMatch.tap() // The + FAB
    app.textFields.firstMatch.tap()

    app.textFields["text-input-flat"].firstMatch.typeText(name)
    
    app.buttons["Save changes"].firstMatch.tap()
  }

  func openProfile(app: XCUIApplication, name profileName: String) {
    app.buttons["󱀨, \(profileName)"].firstMatch.tap()
    app.buttons["Continue"].firstMatch.tap()
  }
  
  func deleteProfile(app: XCUIApplication, name profileName: String) {
    app.buttons["󱀨, \(profileName)"].firstMatch.press(forDuration: 2.0)
    app.buttons["Delete"].firstMatch.tap()
    app.buttons["Delete profile \"\(profileName)\""].firstMatch.tap()
  }
}
