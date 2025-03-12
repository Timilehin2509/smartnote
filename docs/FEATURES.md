# Feature Documentation

## Note Taking System

### Cornell Method Implementation
- **Main Content Area**: Primary note-taking space
- **Cue Column**: Questions, keywords, and comments
- **Summary Section**: Brief overview of the note content

### Rich Text Editor
- Full WYSIWYG editing with TinyMCE
- Markdown support
- Keyboard shortcuts:
  - `Ctrl/Cmd + B`: Bold
  - `Ctrl/Cmd + I`: Italic
  - `Ctrl/Cmd + U`: Bullet list
  - `Ctrl/Cmd + O`: Numbered list

### Note Organization
- Category-based organization
- Tag system for flexible organization
- Bidirectional note linking
- Full-text search across all content

## User Features

### Profile Management
- Username customization
- Email display (non-editable)
- Password change functionality
- Account deletion option

### Statistics Dashboard
- Total notes count
- Categories count
- Unique tags count
- Connected notes count

### Theme System
- Dark/Light mode toggle
- System preference detection
- Theme persistence across sessions

## Search Functionality

### Global Search
- Real-time search suggestions
- Search across:
  - Note titles
  - Note content
  - Categories
  - Tags

### Search Filters
- Category filter
- Tag filter
- Date range filter

## Security Features

### Authentication
- JWT-based session management
- Secure password hashing
- Protected API routes

### Data Protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting