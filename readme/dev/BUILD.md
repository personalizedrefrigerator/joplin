# Building the applications

The Joplin source code is hosted on a [monorepo](https://en.wikipedia.org/wiki/Monorepo) and is managed using Yarn workspaces (as well as Lerna for publishing the packages).

The list of the main sub-packages is below:

Package name | Description
--- | ---
app-cli | The CLI application
app-clipper | The web clipper
app-desktop | The desktop application
app-mobile | The mobile application
lib | The core library, shared by all applications. It deals with things like synchronisation, encryption, import/export, database and pretty much all the app business logic
renderer | The Joplin Markdown and HTML renderer
tools | Tools used to build the apps and other tasks

There are also a few forks of existing packages under the "fork-*" name.

## Required dependencies

All of the required dependencies are listed within the [devbox.json](https://github.com/laurent22/joplin/blob/dev/devbox.json) file in the project root. You can either manually install them based on that list, or you can automatically install them on Linux or MacOS by using:

```sh
devbox shell
```

If you don't already have devbox, please [follow these instructions](https://www.jetify.com/docs/devbox/quickstart/).

If working on the `onenote-converter` packages you will need to install the [Rust toolchain](https://rustup.rs/).

## Building

Make sure the path to the project directory does not contain spaces or the build may fail.

Before doing anything else, from the root of the project, run:

	yarn install

Then you can test the various applications:

## Testing the desktop application

	cd packages/app-desktop
	yarn start

Use the regular Command Prompt to develop in Windows. We [do not recommend using WSL for this](https://github.com/laurent22/joplin/blob/dev/readme/dev/build_troubleshooting.md#other-issues) and we do not support this use case.

## Testing the Terminal application

	cd packages/app-cli
	yarn start

## Testing the Mobile application

First you need to setup React Native to build projects with native code. For this, follow the instructions in the [Setting up the development environment](https://reactnative.dev/docs/environment-setup) tutorial, in the "React Native CLI Quickstart" tab.

### Android

Run this to build and install the app on the emulator:

	cd packages/app-mobile/android
	./gradlew installDebug # or gradlew.bat installDebug on Windows

### iOS

On iOS, you need to run `pod install`, which is not done automatically during build time (since it takes too long). You have two options:

- Build the app using `RUN_POD_INSTALL=1 yarn install`
- Or manually run `pod install` from `packages/app-mobile/ios`

Once this is done, open the file `ios/Joplin.xcworkspace` on XCode and run the app from there.

Normally the **bundler** should start automatically with the application. If it doesn't, run `yarn start` from `packages/app-mobile`.

### Web

To run the mobile app in a web browser,

	cd packages/app-mobile
	yarn serve-web

Above, `yarn serve-web` starts a development server on port `8088`. The built version of the web app auto-reloads the full page when a change is made to the source files.

To instead reload individual components on change (hot reload), serve with the following command:

	yarn serve-web-hot-reload

To create a release build, run `yarn web`. The built output will be stored in `packages/app-mobile/web/dist`.

Like the iOS and Android builds, it's necessary to compile TypeScript to JS. See "Watching files" below.

## Building the clipper

	cd packages/app-clipper/popup
	npm run watch # To watch for changes

To test the extension please refer to the relevant pages for each browser: [Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#Trying_it_out) / [Chrome](https://developer.chrome.com/docs/extensions/mv3/getstarted/). Please note that the extension in dev mode will only connect to a dev instance of the desktop app (and vice-versa).

## Watching files

To make changes to the application, you'll need to rebuild any TypeScript file you've changed. The simplest way to do this is to watch for changes from the root of the project. Simply run this command, and it should take care of the rest:

	yarn watch

Running `yarn tsc` would have the same effect, but without watching.

**Mobile-specific note**: If making changes to the note editor, viewer, or other WebView content, run `yarn watchInjectedJs` from `packages/app-mobile` to rebuild the WebView JavaScript files on change.

## Running an application with additional parameters

You can specify additional parameters when running the desktop or CLI application. To do so, add `--` to the `yarn start` command, followed by your flags. For example:

	yarn start --debug

## TypeScript

The application was originally written in JavaScript, however it has slowly been migrated to [TypeScript](https://www.typescriptlang.org/). New classes and files should be written in TypeScript. All compiled files are generated next to the .ts or .tsx file. So for example, if there's a file "lib/MyClass.ts", there will be a generated "lib/MyClass.js" next to it. It is implemented that way as it requires minimal changes to integrate TypeScript in the existing JavaScript code base.

## Troubleshooting

Please read for the [Build Troubleshooting Document](https://github.com/laurent22/joplin/blob/dev/readme/dev/build_troubleshooting.md) for various tips on how to get the build working.
