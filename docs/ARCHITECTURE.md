# Architecture Documentation

## Project Structure
```
smartnote/
├── public/
│   ├── css/
│   │   ├── base/          # Core styles
│   │   ├── components/    # Component-specific styles
│   │   └── utilities/     # Utility classes
│   └── js/
│       ├── auth-handlers.js    # Authentication logic
│       ├── editor-utils.js     # Editor helpers
│       ├── note-link-manager.js # Note linking
│       └── view-note.js        # Note viewing/editing
├── server/
│   └── src/
│       ├── config/        # Server configuration
│       └── routes/        # API routes
└── views/
    ├── layouts/          # Base templates
    ├── pages/           # Page templates
    └── partials/        # Reusable components
```

## Database Schema
Detailed table relationships and indexing strategy.

### Core Tables
1. **users**
   - Primary user information
   - Authentication data
   - Preferences storage

2. **notes**
   - Cornell method fields
   - Category references
   - Tag storage (JSON)
   - Timestamps

3. **categories**
   - User-specific categories
   - Hierarchical structure

4. **note_links**
   - Bidirectional relationships
   - Source/target tracking

## Authentication Flow
1. User registration/login
2. JWT token generation
3. Token storage in localStorage
4. Auth middleware validation
5. Protected route access

## Frontend Architecture
- Component-based structure
- Event-driven interactions
- Real-time UI updates
- State management

## Component Architecture

### Views
1. **Layouts**
   - `main.ejs`: Base template with common elements
   - `auth.ejs`: Authentication pages layout

2. **Partials**
   - `nav.ejs`: Navigation bar component
   - `search.ejs`: Global search component
   - `editor.ejs`: Note editor component

3. **Pages**
   - Notes views
   - Category views
   - Profile management
   - Authentication pages

### CSS Architecture
1. **Base Layer**
   - Variables (Dark/Light themes)
   - Typography
   - Reset/Normalize

2. **Components Layer**
   - Navbar styles
   - Button styles
   - Form styles
   - Card styles
   - Editor styles

3. **Utilities Layer**
   - Helper classes
   - Theme variations
   - Responsive utilities

## State Management
1. **Authentication State**
   - Token management
   - User session handling
   - Permission checks

2. **UI State**
   - Theme preferences
   - Search filters
   - Editor state
   - Navigation state

## Data Flow
1. **Note Operations**
   ```
   User Action → API Request → Database Update → UI Update
   ```

2. **Search Operations**
   ```
   User Input → Filter Application → API Query → Results Display
   ```

3. **Category Management**
   ```
   Category Action → API Update → Note References Update → UI Refresh
   ```

## Security Implementation
1. **Authentication**
   - JWT implementation
   - Token refresh mechanism
   - Session management

2. **Data Protection**
   - Input sanitization
   - XSS prevention
   - CSRF protection
   - SQL injection prevention

3. **API Security**
   - Rate limiting
   - Request validation
   - Error handling
   - Secure headers

## Performance Optimizations
1. **Frontend**
   - Asset minification
   - Lazy loading
   - Cache management
   - Bundle optimization

2. **Backend**
   - Query optimization
   - Connection pooling
   - Response caching
   - Efficient routing

3. **Database**
   - Indexing strategy
   - Query optimization
   - Connection management
   - Transaction handling

## Error Handling
1. **Client-side**
   - Input validation
   - API error handling
   - UI error states
   - Recovery mechanisms

2. **Server-side**
   - Request validation
   - Database error handling
   - Authentication errors
   - Global error middleware

## Testing Strategy
1. **Unit Tests**
   - Component testing
   - Utility function testing
   - API route testing

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - Authentication flows

3. **End-to-End Tests**
   - User flows
   - Critical paths
   - Edge cases