# Swagger Quick Start Guide

## 🚀 Start Using Swagger in 3 Steps

### Step 1: Start the Application
```bash
npm run start:dev
```

### Step 2: Open Swagger UI
Navigate to:
```
http://localhost:3001/api/docs
```

### Step 3: Authenticate (for protected endpoints)
1. Click the **"Authorize"** 🔒 button (top right)
2. Login first using `POST /auth/login` to get your token
3. Enter: `Bearer <your-token>` (replace `<your-token>` with the actual token)
4. Click **"Authorize"** then **"Close"**
5. Now you can test all protected endpoints!

---

## 📝 Quick Reference

### Testing an Endpoint
1. Expand the endpoint you want to test
2. Click **"Try it out"**
3. Fill in the parameters/body
4. Click **"Execute"**
5. View response below

### Common Endpoints to Try First

#### 1. Register a New User
```
POST /auth/register
```
Body:
```json
{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### 2. Login
```
POST /auth/login
```
Body:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Copy the `access_token` from the response!**

#### 3. Get Current User (Protected)
```
GET /users/me
```
Requires: JWT token in Authorization

#### 4. View All Vinyls
```
GET /vinyls?page=1&limit=10
```
No auth required

#### 5. Create a Review (Protected)
```
POST /reviews/{vinylId}
```
Body:
```json
{
  "score": 5,
  "comment": "Amazing album! Highly recommended."
}
```

---

## 🎯 Key Features

- **🔐 JWT Authentication** - Secure all protected endpoints
- **📄 Auto-Generated Docs** - Always up-to-date with code
- **🧪 Interactive Testing** - Test APIs directly in browser
- **📊 Data Models** - View all schemas and validation rules
- **🔍 Search & Filter** - Find endpoints quickly
- **💾 Persistent Auth** - Token saved after page refresh

---

## 🏷️ Endpoint Organization

- **Authentication** - Register, Login, Logout
- **Users** - Profile management
- **Vinyls** - Vinyl catalog CRUD
- **Reviews** - Review system
- **Stripe** - Payment processing
- **System** - Health checks and logs

---

## ⚡ Pro Tips

1. **Use the Filter**: Type in the search box to quickly find endpoints
2. **Collapse All**: Click the tag names to collapse/expand sections
3. **View Models**: Scroll to bottom to see all data structures
4. **Copy Examples**: Click the example values to use them
5. **Check Duration**: See how fast each request executes

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Swagger not loading | Check app is running on port 3001 |
| 401 Unauthorized | Click "Authorize" and add your JWT token |
| Token format error | Use `Bearer <token>` with space |
| Endpoint returns 403 | You need ADMIN role for this endpoint |

---

## 📱 Accessing on Different Environments

### Local Development
```
http://localhost:3001/api/docs
```

### Staging
```
https://staging-api.vinylstore.com/api/docs
```

### Production
```
https://api.vinylstore.com/api/docs
```

---

## 📖 Need More Details?

See the full documentation:
- `SWAGGER_IMPLEMENTATION.md` - Complete implementation details
- `SWAGGER_GUIDE.md` - Developer guide for extending Swagger

---

**Happy Testing! 🎉**

