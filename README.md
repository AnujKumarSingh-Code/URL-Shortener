# **URL Shortener API Documentation**

## **Overview**

This is a URL shortener application that allows users to shorten long URLs and retrieve the original URL by using a short version. It uses **Node.js**, **Express**, **MongoDB** for storage, and **Redis** for caching to improve performance.

### Key Features:
- **Shorten URL**: Converts long URLs to short, unique URLs.
- **Redirect**: Redirects users from the shortened URL to the original long URL.
- **Caching with Redis**: Caches shortened URLs and their redirections to minimize database calls and improve performance.

---

## **API Endpoints**

### **1. POST /url/shorten**
This endpoint generates a short URL from a given long URL. If the URL has already been shortened, it returns the cached result or the one from the database.

#### **Request**:
- **URL**: `/url/shorten`
- **Method**: `POST`
- **Content-Type**: `application/json`
  
#### **Request Body**:
```json
{
  "longUrl": "http://example.com/very/long/url"
}
```

#### **Response**:
- **Success Response**:
  ```json
  {
    "status": true,
    "data": {
      "longUrl": "http://example.com/very/long/url",
      "shortUrl": "http://localhost:3000/abc123",
      "urlCode": "abc123"
    }
  }
  ```

- **Error Response** (invalid request):
  ```json
  {
    "status": false,
    "message": "Invalid long URL"
  }
  ```

#### **Caching**:
- Before creating a new short URL, the app checks Redis for a cached entry.
- If found, the cached entry is returned, avoiding a database call.
- If not found, the URL is shortened, stored in MongoDB, and cached in Redis for future requests.

#### **Cache Expiry**:
- The shortened URL is cached for 24 hours (`EX: 86400`).

---

### **2. GET /:urlCode**
This endpoint redirects the user from a shortened URL to the original long URL.

#### **Request**:
- **URL**: `/abc123` (where `abc123` is the short URL code)
- **Method**: `GET`

#### **Response**:
- **Success**: Redirects to the long URL.
  - HTTP Status Code: `302` (Found)
- **Error Response**:
  ```json
  {
    "status": false,
    "message": "URL not found"
  }
  ```

#### **Caching**:
- The app checks Redis for a cached entry of the `urlCode`.
- If found, it redirects the user to the cached long URL.
- If not found, the app queries the MongoDB database for the `urlCode` and caches the result.

#### **Cache Expiry**:
- Cached URLs for redirection are stored for 24 hours (`EX: 86400`).

---

## **Redis Caching**

### **Why Caching?**
Caching helps reduce the load on the database by storing frequently accessed URLs in-memory. When a user requests a shortened URL or a redirection, the app first checks Redis to see if the data is cached.

- **Cached on URL Shortening**: When a URL is shortened, the result is stored in Redis, so subsequent requests for the same long URL don’t hit the database.
- **Cached on Redirection**: When a user is redirected from the shortened URL, the app checks Redis for the corresponding long URL before querying the database.

### **Redis Client Configuration**:
Make sure Redis is installed and running. The app connects to Redis via the following configuration:

```javascript
const redis = require('redis');
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch((err) => {
    console.error('Could not connect to Redis:', err);
  });

module.exports = { redisClient };
```

---

## **Error Handling**

### **General Error Structure**:
If the API encounters an error (such as invalid input or a server issue), it returns a structured error response:

```json
{
  "status": false,
  "message": "Error message"
}
```

### **Possible Errors**:
- **400 Bad Request**: Returned if the input (such as the long URL) is invalid.
- **404 Not Found**: Returned if the `urlCode` does not exist.
- **500 Internal Server Error**: Returned if the server encounters an unexpected issue.

---

## **Example Usage**

### **Shorten a URL**:
- **Request**:
  ```bash
  curl -X POST http://localhost:3000/url/shorten \
  -H 'Content-Type: application/json' \
  -d '{"longUrl": "http://example.com/very/long/url"}'
  ```

- **Response**:
  ```json
  {
    "status": true,
    "data": {
      "longUrl": "http://example.com/very/long/url",
      "shortUrl": "http://localhost:3000/abc123",
      "urlCode": "abc123"
    }
  }
  ```

### **Redirect from a Short URL**:
- **Request**:
  ```bash
  curl -L http://localhost:3000/abc123
  ```

This will redirect to the original long URL.

---

## **Technologies Used**

### **1. Node.js**
- **Express**: Framework for building the API.
  
### **2. MongoDB**
- **Mongoose**: ODM (Object Data Modeling) library to interact with MongoDB.
- MongoDB is used to store long URLs, short URLs, and the corresponding URL codes.

### **3. Redis**
- In-memory data structure store used for caching.
  
### **4. nanoid**
- Library used for generating short, unique URL codes.

---

## **Database Schema**

### **URL Model (`urlModel.js`)**:

```javascript
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  urlCode: { type: String, required: true, unique: true, trim: true },
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Url', urlSchema);
```

### **Explanation**:
- **`urlCode`**: The unique code that forms the shortened URL.
- **`longUrl`**: The original long URL.
- **`shortUrl`**: The shortened URL generated using the `urlCode`.

---

## **Environment Variables**
The following environment variables should be set in a `.env` file for the app to run correctly:

```plaintext
MONGO_URI=mongodb://localhost:27017/DatabaseShortener
BASE_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_password_or_app_password
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### **Keys**:
- **`MONGO_URI`**: MongoDB connection string.
- **`BASE_URL`**: The base URL for the application (e.g., `http://localhost:3000`).
- **`JWT_SECRET`**: Secret key for JWT authentication (if needed).
- **`EMAIL_USER`** and **`EMAIL_PASS`**: Email credentials (if email features are used).
- **`REDIS_HOST`** and **`REDIS_PORT`**: Redis connection settings.

---

## **Setup Instructions**

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd url-shortener
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run Redis (if not running already)**:
   ```bash
   redis-server
   ```

4. **Run MongoDB (if not running already)**:
   ```bash
   mongod
   ```

5. **Start the server**:
   ```bash
   npm run dev
   ```

6. **Test the API** using tools like **Postman** or **cURL**.

---

