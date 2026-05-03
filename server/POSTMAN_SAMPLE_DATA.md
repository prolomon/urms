# Admin API Postman Sample Data

## 1. Create Admin
**Method:** POST  
**URL:** `http://localhost:5000/api/admin`  
**Headers:** `Content-Type: application/json`

```json
{
  "fullname": "John Admin",
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "avatar": "https://example.com/avatar.jpg",
  "role": "ADMIN",
  "paymentConfig": {
    "amac": 10,
    "agent": 15,
    "technology": 20,
    "operation": 25
  },
  "pricing": []
}
```

---

## 2. Login Admin
**Method:** POST  
**URL:** `http://localhost:5000/api/admin/login`  
**Headers:** `Content-Type: application/json`

```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Response:** You'll get an `admin` object with `uid` (use this for subsequent requests)

---

## 3. Get All Admins
**Method:** GET  
**URL:** `http://localhost:5000/api/admin?page=1&limit=20`  
**Headers:** 
- `Authorization: Bearer <your_token>`
- `Content-Type: application/json`

---

## 4. Get Pricing List
**Method:** GET  
**URL:** `http://localhost:5000/api/admin/ADM-20260117-4fyut1/pricing`  
**Headers:** 
- `Authorization: Bearer <your_token>`
- `Content-Type: application/json`

Replace `ADM-20260117-4fyut1` with the admin's `uid`

---

## 5. Add Pricing Item
**Method:** POST  
**URL:** `http://localhost:5000/api/admin/ADM-20260117-4fyut1/pricing`  
**Headers:** 
- `Authorization: Bearer <your_token>`
- `Content-Type: application/json`

```json
{
  "id": "price-001",
  "title": "Individual Business",
  "value": "individual",
  "price": 80000,
  "type": "INDIVIDUAL",
  "benefit": "24/7 support"
}
```

---

## 6. Add Multiple Pricing Items (Examples)

### Basic Plan
```json
{
  "id": "price-basic-001",
  "title": "Basic Plan",
  "value": "basic",
  "price": 50000,
  "type": "INDIVIDUAL",
  "benefit": "Email support"
}
```

### Professional Plan
```json
{
  "id": "price-pro-001",
  "title": "Professional Plan",
  "value": "professional",
  "price": 150000,
  "type": "BUSINESS",
  "benefit": "Priority support + API access"
}
```

### Enterprise Plan
```json
{
  "id": "price-enterprise-001",
  "title": "Enterprise Plan",
  "value": "enterprise",
  "price": 500000,
  "type": "BUSINESS",
  "benefit": "Dedicated support + Custom integration"
}
```

---

## 7. Update Pricing Item
**Method:** PUT  
**URL:** `http://localhost:5000/api/admin/ADM-20260117-4fyut1/pricing/price-001`  
**Headers:** 
- `Authorization: Bearer <your_token>`
- `Content-Type: application/json`

```json
{
  "price": 95000,
  "benefit": "Premium 24/7 support + Training"
}
```

**Note:** You can update any field except `id`. If you don't include a field, it will be preserved from the previous value.

---

## 8. Update Admin Details
**Method:** PUT  
**URL:** `http://localhost:5000/api/admin/ADM-20260117-4fyut1`  
**Headers:** 
- `Authorization: Bearer <your_token>`
- `Content-Type: application/json`

```json
{
  "fullname": "John Admin Updated",
  "avatar": "https://example.com/new-avatar.jpg",
  "paymentConfig": {
    "amac": 12,
    "agent": 18,
    "technology": 22,
    "operation": 28
  }
}
```

---

## 9. Delete Admin
**Method:** DELETE  
**URL:** `http://localhost:5000/api/admin/ADM-20260117-4fyut1`  
**Headers:** 
- `Authorization: Bearer <your_token>`
- `Content-Type: application/json`

---

## Notes:
- Replace `ADM-20260117-4fyut1` with your actual admin UID from login response
- All endpoints except `/login` require authentication token in the `Authorization: Bearer <token>` header
- When adding pricing items, generate unique `id` values
- The `price` field should be a number (not a string)
- Valid `type` values: `INDIVIDUAL` or `BUSINESS`
