# Install dependencies and run `yarn dist` for the Windows desktop app.
# Extra args are forwarded to `yarn dist` (e.g. --publish=never).
#
# `yarn install` can fail randomly on CI when node-pre-gyp downloads prebuilt
# sqlite3 binaries from GitHub Releases, so we retry it a few times.
function Build-WindowsApp {
	param([string[]]$DistArgs = @())

	# Force the postinstall build to run sequentially. Setting this here (rather
	# than only on the workflow step) ensures it reaches every child process
	# spawned by `yarn install` -> postinstall -> gulp on Windows, where parallel
	# builds randomly crash with STATUS_STACK_BUFFER_OVERRUN (0xC0000409).
	$env:BUILD_SEQUENCIAL = '1'
	$env:IS_CONTINUOUS_INTEGRATION = '1'

	$attempts = 3
	for ($i = 1; $i -le $attempts; $i++) {
		yarn install
		if ($LASTEXITCODE -eq 0) { break }
		if ($i -eq $attempts) { exit $LASTEXITCODE }
		Write-Host "yarn install failed (attempt $i/$attempts) - retrying..."
		Start-Sleep -Seconds 10
	}

	cd packages/app-desktop
	yarn dist @DistArgs
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
