# Tabsy Privacy Policy

Last updated: September 11, 2026

## What permissions we request and why
Tabsy is built to be a fast, local-only Chrome extension. We request the following minimal permissions in order to function:

- **`tabs`**: Required to read the URLs and titles of the tabs in your current window so they can be saved into a workspace. Also required to restore your workspaces by opening those URLs.
- **`storage`**: Required to save your workspaces and extension settings persistently. We use `chrome.storage.local`.
- **`sidePanel`**: Required to render the main Tabsy user interface directly alongside your browsing experience.
- **`contextMenus`**: Required to add the right-click "Save page to Tabsy" options to your Chrome context menu.
- **`commands`**: (Declared configuration) Required to enable the `Ctrl+Shift+T` and `Ctrl+Shift+S` keyboard shortcuts.

## What data is stored
We store the names, visual customizations (icons and colors), and the URLs and titles of the tabs you explicitly choose to save into a workspace. We also store your extension preferences (like your preferred theme and behavior settings). 

## Where your data is stored
Everything is stored **100% locally on your own machine** inside Chrome's secure local extension storage (`chrome.storage.local`). Tabsy does not have a backend server, and your data is never synced to the cloud unless you explicitly use the built-in "Export Workspaces" feature to download a backup file to your own hard drive.

## What data is NOT collected
Tabsy respects your privacy. The extension **DOES NOT**:
- Track your browsing history.
- Collect analytics, telemetry, or crash reports.
- Send your data to any remote servers, APIs, or databases.
- Read or manipulate the content of the webpages you visit.
- Contain any ads or third-party trackers.

If you have any questions or concerns, please open an issue in the project repository.
