# SmartNote

A structured note-taking application with Cornell Method support, built with Node.js, Express, and MySQL.

## Features

### Core Functionality
- **Cornell Note-Taking Method**: Structured notes with main content, cue column, and summary sections
- **Rich Text Editing**: Full WYSIWYG editor with markdown support
- **Note Organization**: Categories and tags for efficient organization
- **Note Linking**: Create bidirectional links between related notes
- **Global Search**: Search across notes, categories, and tags

### User Management
- **Authentication**: Secure user registration and login
- **Profile Management**: Update profile information and preferences
- **Account Security**: Password change and account deletion options
- **Statistics Dashboard**: View note counts, categories, tags, and connections

### User Interface
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light modes
- **Interactive Elements**: Dynamic loading and real-time updates
- **Modern UI**: Bootstrap-based clean and intuitive interface

## Technology Stack

### Frontend
- HTML5/CSS3/JavaScript (ES6+)
- Bootstrap 5 for responsive design
- TinyMCE for rich text editing
- EJS for template rendering

### Backend
- Node.js & Express.js
- MySQL database with mysql2 driver
- JWT for authentication
- bcrypt for password hashing

### Libraries & Tools
- `express-ejs-layouts` for layout management
- `marked` for markdown processing
- `highlight.js` for code syntax highlighting
- `cors` for Cross-Origin Resource Sharing
- `dotenv` for environment variable management

## Project Structure

```
smartnote/
├── public/
│   ├── css/
│   │   ├── base/
│   │   ├── components/
│   │   └── utilities/
│   └── js/
├── server/
│   └── src/
│       ├── config/
│       └── routes/
└── views/
    ├── layouts/
    ├── pages/
    └── partials/
```

## Setup & Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smartnote
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=smartnote
JWT_SECRET=your_jwt_secret
```

4. Set up the database:
```bash
npm run setup
```

5. Start the server:
```bash
npm start
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table
```sql
CREATE TABLE notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    cue_column TEXT,
    summary TEXT,
    category_id INT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Categories Table
```sql
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Note Links Table
```sql
CREATE TABLE note_links (
    source_id INT,
    target_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id, target_id),
    FOREIGN KEY (source_id) REFERENCES notes(id),
    FOREIGN KEY (target_id) REFERENCES notes(id)
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout

### Notes
- `GET /api/notes`: Get all user notes
- `GET /api/notes/:id`: Get single note
- `POST /api/notes`: Create note
- `PUT /api/notes/:id`: Update note
- `DELETE /api/notes/:id`: Delete note

### Categories
- `GET /api/categories`: Get all categories
- `GET /api/categories/:id`: Get category with notes
- `POST /api/categories`: Create category
- `PUT /api/categories/:id`: Update category
- `DELETE /api/categories/:id`: Delete category

### User Profile
- `GET /api/user/profile`: Get user profile
- `PUT /api/user/profile`: Update profile
- `GET /api/user/stats`: Get user statistics
- `GET /api/user/activity`: Get recent activity
- `DELETE /api/user/profile`: Delete account

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC License

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.