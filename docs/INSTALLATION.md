# Installation Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- NPM (v6 or higher)

## Local Development Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd smartnote
```

2. **Install Dependencies**
```bash
npm install
```

3. **Database Setup**
- Create a MySQL database named 'smartnote'
- Run the schema setup script:
```bash
npm run setup
```

4. **Environment Configuration**
Create a `.env` file in the project root:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=smartnote
JWT_SECRET=your_jwt_secret
```

5. **Start Development Server**
```bash
npm run dev
```

## Production Deployment

1. **Server Requirements**
- Node.js runtime environment
- MySQL database server
- Nginx (recommended) or Apache web server
- SSL certificate for HTTPS

2. **Build & Deployment**
```bash
# Install production dependencies
npm install --production

# Start production server
npm start
```

3. **Environment Variables**
Configure these environment variables on your server:
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=smartnote
JWT_SECRET=your-secure-jwt-secret
```

4. **Nginx Configuration**
Basic Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```