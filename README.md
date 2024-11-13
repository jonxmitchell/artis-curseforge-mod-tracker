# 🎮 Arti's CurseForge Mod Tracker

A modern, sleek desktop application for tracking and managing CurseForge mod updates with Discord webhook integration.

![Version](https://img.shields.io/badge/version-0.9.8-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=flat&logo=tauri&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=flat&logo=rust&logoColor=white)

## 📖 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Configuration](#️-configuration)
- [Usage Guide](#-usage-guide)
- [Technical Stack](#-technical-stack)
- [Advanced Features](#-advanced-features)
- [Troubleshooting](#-troubleshooting)
- [Development Guide](#-development-guide)
- [Performance Optimization](#-performance-optimization)
- [Contributing](#-contributing)
- [Support](#-support)
- [FAQ](#-frequently-asked-questions)

## ✨ Features

### Core Features

- 📦 Track multiple CurseForge mods across different games
- 🔔 Real-time update notifications via Discord webhooks
- 🎨 Customizable Discord message templates
- 📊 Activity tracking and logging
- 🌗 Modern, dark-mode interface
- ⚡ Fast and lightweight (built with Rust/Tauri)

### Advanced Features

- 🔄 Automatic update checking at customizable intervals
- 📝 Rich text formatting in Discord notifications
- 🎯 Mod-specific webhook assignments
- 📈 Activity history and logging
- 🎭 Custom webhook avatars and usernames

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://www.rust-lang.org/tools/install)
- [Git](https://git-scm.com/downloads)
- [VS Code](https://code.visualstudio.com/) (recommended)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

#### Windows-specific Requirements

- Microsoft Visual Studio C++ Build Tools
- WebView2 Runtime

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/artis-curseforge-mod-tracker.git
cd artis-curseforge-mod-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Generate Cargo lockfile:

```bash
cargo generate-lockfile
```

## 🛠️ Configuration

### CurseForge API Key Setup

1. Visit [CurseForge Console](https://console.curseforge.com)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Add the key in the application settings

### Discord Webhook Integration

#### Creating a Webhook

1. Open Discord server settings
2. Navigate to Integrations > Webhooks
3. Click "Create Webhook"
4. Customize name and channel
5. Copy webhook URL

#### Webhook Security Best Practices

- 🔒 Never share webhook URLs publicly
- 🔄 Rotate webhook URLs periodically
- 📝 Use descriptive webhook names
- 🎯 Create channel-specific webhooks

### Application Settings

#### Update Intervals

- Choose from preset intervals (1min - 24h).

#### Notification Settings

- Custom templates
- Embed colors
- Mention settings
- Thumbnail preferences

## 📚 Usage Guide

### Adding Mods

#### Finding Mod IDs

1. Visit mod page on CurseForge
2. Look for "Project ID" in About This Project
3. Copy the numeric ID

#### Adding to Tracker

1. Click "Add Mod"
2. Paste Project ID
3. Configure webhooks
4. Set update preferences

### Managing Webhooks

#### Creating Webhooks

1. Navigate to Webhooks page
2. Click "Add Webhook"
3. Enter webhook details:
   - Name
   - URL
   - Avatar (optional)
   - Username (optional)

#### Template Customization

1. Enable custom template
2. Customize:
   - Colors
   - Fields
   - Layout
   - Content

#### Variables Available

```
{modName} - Mod name
{modID} - Mod ID
{modAuthorName} - Author name
{latestModFileName} - File name
{newReleaseDate} - New update time
{newReleaseDate} - New update time
{everyone} - @everyone mention
{here} - @here mention
{&roleID} - Mention a role (e.g., {&123456789})
{#channelID} - Channel link (e.g., {#987654321})
```

### Activity Monitoring

#### Activity Types

- Mod updates
- Webhook deliveries
- Configuration changes
- System events

#### Filtering Activities

- By mod
- By date
- By type
- By status

## 🔧 Technical Stack

### Frontend

- **Framework**: Next.js 14
- **UI Library**: NextUI
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide Icons

### Backend

- **Runtime**: Rust
- **Framework**: Tauri
- **Database**: SQLite
- **HTTP Client**: reqwest
- **Serialization**: serde

### Development Tools

- **Package Manager**: npm
- **Build Tool**: Cargo
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git

## 🚀 Advanced Features

### Custom Templates

#### Available Components

- Embeds
- Fields
- Thumbnails
- Footers
- Timestamps

#### Color Management

- Hex color picker
- Preset palettes

### Webhook Management

#### Batch Operations

- Enable/disable multiple
- Template application

#### Testing Features

- Preview mode
- Test messages
- Delivery status

## 🔍 Troubleshooting

### Common Issues

#### API Key Issues

- Verify key validity
- Check permissions
- Ensure proper format

#### Webhook Errors

- Validate URL format
- Check channel permissions

#### Update Issues

- Check internet connection
- Verify mod IDs
- Confirm API status

## 👨‍💻 Development Guide

### Setting Up Development Environment

#### IDE Setup

1. Install VS Code
2. Add recommended extensions:
   - Rust Analyzer
   - Tauri
   - ES7+ React
   - Tailwind CSS IntelliSense

#### Development Commands

```bash
# Start development server
npm run tauri dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Code Structure

```
artis-curseforge-mod-tracker/
├── src/                          # Frontend source code
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePreventBrowserShortcuts.js  # Browser shortcut handling
│   │   ├── useUpdateCheck.js              # Update checking logic
│   │   ├── useContextMenu.js              # Context menu functionality
│   │   └── useModUpdateChecker.js         # Mod update checking logic
│   │
│   ├── styles/                   # Styling
│   │   └── globals.css           # Global CSS styles
│   │
│   ├── contexts/                 # React contexts
│   │   └── UpdateServiceContext.jsx  # Update service state management
│   │
│   ├── app/                      # Next.js pages
│   │   ├── webhooks/             # Webhook management
│   │   ├── webhook-templates/    # Template customization
│   │   ├── mods/                 # Mod management
│   │   ├── page.jsx             # Main dashboard
│   │   └── layout.jsx           # App layout wrapper
│   │
│   └── components/              # React components
│       ├── UpdateCheckButton.jsx    # Update trigger button
│       ├── UpdateCountdown.jsx      # Next update timer
│       ├── Sidebar.jsx             # Navigation sidebar
│       ├── TrackedMods.jsx         # Mod tracking display
│       ├── WebhookEditor.jsx       # Webhook configuration
│       ├── WebhookEditorModal.jsx  # Webhook editing modal
│       ├── WebhookAssignModal.jsx  # Mod-webhook assignment
│       ├── WebhookCard.jsx         # Webhook display card
│       ├── Settings.jsx            # Settings panel
│       ├── ColorPicker.jsx         # Color selection tool
│       ├── DeleteConfirmationModal.jsx  # Deletion confirmation
│       ├── AddModModal.jsx         # New mod addition
│       ├── AddWebhookModal.jsx     # New webhook creation
│       ├── QuickStartGuide.jsx     # Onboarding guide
│       ├── RecentActivity.jsx      # Activity history
│       ├── DiscordPreview.jsx      # Message preview
│       └── ModCard.jsx             # Mod display card
│
├── src-tauri/                    # Rust backend code
│   ├── src/
│   │   ├── database/             # Database operations
│   │   │   ├── settings.rs       # Settings management
│   │   │   ├── webhooks.rs       # Webhook operations
│   │   │   ├── webhook_templates.rs  # Template management
│   │   │   ├── mods.rs          # Mod operations
│   │   │   ├── activities.rs     # Activity logging
│   │   │   ├── init.rs          # Database initialization
│   │   │   └── mod.rs           # Module declarations
│   │   │
│   │   ├── commands/            # Tauri commands
│   │   │   ├── settings_commands.rs    # Settings endpoints
│   │   │   ├── webhook_commands.rs     # Webhook endpoints
│   │   │   ├── webhook_template_commands.rs  # Template endpoints
│   │   │   ├── activity_commands.rs    # Activity endpoints
│   │   │   ├── mod.rs                  # Module declarations
│   │   │   └── mod_commands.rs         # Mod endpoints
│   │   │
│   │   └── main.rs              # Application entry point
│   │
│   ├── icons/                   # Application icons
│   │   ├── icon.png            # PNG icon
│   │   └── icon.ico            # ICO icon
│   │
│   ├── installer.nsi            # Windows installer script
│   ├── tauri.conf.json         # Tauri configuration
│   ├── Cargo.toml              # Rust dependencies
│   ├── build.rs               # Build script
│   └── Cargo.lock             # Rust dependency lock
│
├── README.md                    # Project documentation
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── jsconfig.json               # JavaScript configuration
├── .gitignore                  # Git ignore rules
├── next.config.mjs             # Next.js configuration
├── package.json                # Node.js dependencies
└── package-lock.json           # Node.js dependency lock
```

## ⚡ Performance Optimization

### Frontend Optimization

- Component memoization
- Lazy loading
- Image optimization
- Code splitting

### Backend Optimization

- Connection pooling
- Query optimization
- Caching strategies
- Memory management

## ⤴️ Backing Up Your Database

It's a good practice to periodically back up your database, especially before updating the application or making significant changes. To do this:

1.  Press Windows Start button and search `Run`.
1.  Type `%LOCALAPPDATA%\\artis-curseforge-mod-tracker` and press Enter.
1.  Copy the `curseforge_tracker.db` file to a safe location (e.g., an external drive or cloud storage).

⚠️ **Warning**: Deleting or modifying files in the database can result in loss of your tracked mods, settings, and webhook configurations as well as cause errors. Always create a backup before making changes.

## 🤝 Contributing

### Getting Started

1. Fork repository
2. Create feature branch
3. Set up development environment
4. Make changes
5. Submit PR

### Commit Guidelines

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Formatting changes
refactor: Code restructuring
test: Add/modify tests
```

## 💖 Support

### Community

- [Discord Server](https://discord.gg/sGgerkNSWQ)
- [Bug Reports](https://github.com/yourusername/artis-curseforge-mod-tracker/issues)

### Financial Support

- [Ko-fi](https://ko-fi.com/artiartificial)

## ❓ Frequently Asked Questions

### General

**Q: Is this free to use?**
A: Yes, completely free and open source.

**Q: Which operating systems are supported?**
A: Windows, macOS, and Linux.

### Technical

**Q: Can I track multiple games?**
A: Yes, you can track mods from any game on CurseForge.

**Q: How often can I check for updates?**
A: Minimum interval is 1 minute, recommended 30 minutes.

### Support

**Q: Where can I get help?**
A: Join our Discord server or open a GitHub issue.

**Q: How do I report bugs?**
A: Create an issue on GitHub with reproduction steps.

## 🦺 Is the application Safe?

**Yes, CurseForge Mod Tracker is safe to use.** Here's why you can trust our application:

1. **Open Source**: Our entire codebase is open source and available for review on GitHub. You can inspect every line of code we use.
2. **Transparent Development**: All development is done in the open, with public pull requests and issue discussions.
3. **No Data Collection**: We do not collect any personal data or telemetry from your system.
4. **Local Operation**: The app operates locally on your machine, only connecting to CurseForge APIs for mod data.

### How to Bypass the SmartScreen Warning

If you encounter the SmartScreen warning, you can safely bypass it:

1. Click on "More info" in the SmartScreen popup.
2. Then click on "Run anyway".

### Build It Yourself

For maximum security assurance, you can build the application yourself:

1. Clone the repository:

```bash
git clone https://github.com/yourusername/artis-curseforge-mod-tracker.git
cd artis-curseforge-mod-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Generate Cargo lockfile:

```bash
cargo generate-lockfile
```

### Official Links

- 📱 [Discord](https://discord.gg/sGgerkNSWQ)
- 📂 [GitHub](https://github.com/jonxmitchell)
