# Tabsy Privacy Policy

Last updated: September 12, 2026

## What permissions we request and why
Tabsy is built to be a fast, secure Chrome extension. We request the following minimal permissions in order to function:

- **`tabs`**: Required to read the URLs and titles of the tabs in your current window so they can be saved into a workspace. Also required to restore your workspaces by opening those URLs.
- **`tabGroups`**: Required to preserve and restore native Chrome tab groups, including their names and colors.
- **`storage`**: Required to save your workspaces and extension settings persistently. We use `chrome.storage.local`.
- **`sidePanel`**: Required to render the main Tabsy user interface directly alongside your browsing experience.
- **`contextMenus`**: Required to add the right-click "Save page to Tabsy" options to your Chrome context menu.
- **`commands`**: Required to enable the `Ctrl+Shift+T` and `Ctrl+Shift+S` keyboard shortcuts.
- **`identity`**: Required exclusively if you explicitly opt-in to Cloud Sync. This allows you to securely authenticate with your Google account.

## What data is stored
We store the names, visual customizations (icons and colors), text notes, and the URLs and titles of the tabs you explicitly choose to save into a workspace. We also store your extension preferences (like your preferred theme and behavior settings). 

## Where your data is stored

Tabsy operates with a **Local-First** architecture, giving you total control over where your data lives.

**1. Local Mode (Default)**
If you do not sign in, Tabsy runs **100% locally on your own machine** inside Chrome's secure local extension storage (`chrome.storage.local`). Your data never leaves your browser.

**2. Cloud Sync Mode (Opt-In)**
If you explicitly choose to sign in using your Google Account via the Settings panel, your workspaces are securely synced to our private Firebase Firestore database. 
- Your data is protected by strict, user-isolated security rules (only you can read and write your data).
- When you use the "Share Workspace" feature, a snapshot of that specific workspace is temporarily stored in a public, read-only collection for 30 days so the recipient can download it.

## What data is NOT collected
Tabsy respects your privacy. Even if you use Cloud Sync, the extension **DOES NOT**:
- Track your browsing history outside of the tabs you actively save.
- Collect hidden analytics, telemetry, or crash reports.
- Read or manipulate the DOM content of the webpages you visit.
- Contain any ads, marketing cookies, or third-party trackers.

If you have any questions or concerns, please open an issue in the project repository.
