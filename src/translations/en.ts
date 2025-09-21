export default {
  "header": {
    "title": "My Shortcuts",
    "totalThisMonth": "Total This Month",
    "manageCategories": "Manage Categories",
    "addSite": "Add Site",
    "signIn": "Sign in with Google",
    "signOut": "Sign Out"
  },
  "shortcutGrid": {
    "noShortcuts": "No shortcuts yet",
    "getStarted": "Add your first site to get started.",
    "uncategorized": "Uncategorized",
    "signInPrompt": "Please sign in",
    "signInToSync": "Sign in with Google to sync your shortcuts.",
    "loading": "Loading shortcuts...",
    "localModeTitle": "Ready to get started?",
    "localModeMessage": "Add shortcuts to begin. Your data will be stored locally on this device."
  },
  "shortcutItem": {
    "edit": "Edit {name}",
    "delete": "Delete {name}",
    "paymentDue": "Payment due soon!"
  },
  "addModal": {
    "title": "Add New Site",
    "siteName": "Site Name",
    "siteNamePlaceholder": "e.g., Netflix",
    "siteUrl": "Site URL",
    "siteUrlPlaceholder": "e.g., netflix.com",
    "categoryLabel": "Category (optional)",
    "uncategorized": "Uncategorized",
    "paymentDateLabel": "Next Payment Date (optional)",
    "paymentDateHelp": "Select a date to mark this site as a subscription.",
    "paymentAmountLabel": "Payment Amount (USD)",
    "paymentAmountPlaceholder": "e.g., 15.99",
    "paymentFrequencyLabel": "Payment Frequency",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "errorRequired": "Site name and URL are required.",
    "errorInvalidUrl": "Please enter a valid URL.",
    "cancel": "Cancel",
    "save": "Save"
  },
  "editModal": {
    "title": "Edit Site",
    "update": "Update"
  },
  "categoryModal": {
    "title": "Manage Categories",
    "noCategories": "No categories yet.",
    "addNew": "Add New Category",
    "addNewPlaceholder": "e.g., Work",
    "add": "Add",
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit {name}",
    "delete": "Delete {name}",
    "deleteConfirm": "Are you sure you want to delete this category? Shortcuts in this category will become uncategorized."
  },
  "languageSwitcher": {
    "label": "Language"
  },
  "syncStatus": {
    "local": "Local Storage",
    "localTooltip": "Data is stored only on this device.",
    "googleSheets": "Google Sheets",
    "syncedTooltip": "Data is synced with Google Sheets.",
    "firebase": "Firebase",
    "firebaseTooltip": "Data is synced with Firebase Realtime Database."
  },
  "configModal": {
    "connect": "Connect Sync",
    "copy": "Copy",
    "copied": "Copied!"
  },
  "storageMode": {
    "title": "Choose Storage Mode",
    "local": "Local Storage",
    "localDescription": "Data is stored only on this device. Simplest and fastest option.",
    "firebase": "Firebase Realtime DB",
    "firebaseDescription": "Real-time cloud database with sync across multiple devices.",
    "googleSheets": "Google Sheets",
    "googleSheetsDescription": "Store data in Google Sheets. Manage data directly in spreadsheets."
  },
  "common": {
    "cancel": "Cancel",
    "save": "Save", 
    "confirm": "Confirm",
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "success": "Success"
  }
} as const;