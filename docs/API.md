# Kafe API

REST API for a coffee shop management system built with NestJS + Clean Architecture.

- **Base URL**: `/api/v1`
- **Swagger UI**: `/api/v1/docs`
- **Auth**: Bearer token (obtained via `POST /api/v1/auth/login`)

## Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full access to all endpoints |
| `BARISTA` | Access to order queue, order status updates, and inventory alerts |
| `CLIENT` | Access to their own order history |

## Rate Limiting

The login endpoint is limited to **5 requests per 60 seconds** per IP.

## Pagination

All list endpoints accept query parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | `1` | — | Page number (min 1) |
| `limit` | integer | `20` | `100` | Items per page |

Paginated responses have the shape:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

## Error Responses

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

## Auth

### `POST /api/v1/auth/login`

Authenticate with email and password. Returns a Bearer token.

- **Auth**: Public
- **Rate limit**: 5 requests / 60 s

**Request body**

```json
{
  "email": "maria@kafe.com",
  "password": "secret1234"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | yes | valid email |
| `password` | string | yes | min 12 chars |

**Response `200`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Maria Silva",
    "email": "maria@kafe.com",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Errors**: `401` — invalid credentials.

---

## Categories

Base path: `/api/v1/categories`

### `GET /api/v1/categories`

List categories with pagination.

- **Auth**: Public

**Query parameters**: `page`, `limit` (see [Pagination](#pagination))

**Response `200`** — paginated list of categories.

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Specialty Coffees",
      "description": "Single-origin coffees",
      "sortOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

### `GET /api/v1/categories/:id`

Get a single category by ID.

- **Auth**: Public

**Response `200`**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Cafés Especiais",
  "description": "Cafés de origem única",
  "sortOrder": 1,
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00.000Z"
}
```

**Errors**: `404` — category not found.

---

### `POST /api/v1/categories`

Create a new category.

- **Auth**: Bearer — `ADMIN`

**Request body**

```json
{
  "name": "Coffees",
  "description": "Specialty coffees and espressos",
  "sortOrder": 1
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | min 2 chars |
| `description` | string | no | — |
| `sortOrder` | integer | no | min 0, default `0` |

**Response `201`** — created category object.

**Errors**: `401`, `403`.

---

### `PATCH /api/v1/categories/:id`

Update a category.

- **Auth**: Bearer — `ADMIN`

**Request body** (all fields optional)

```json
{
  "name": "Coffees",
  "description": "Specialty coffees and espressos",
  "sortOrder": 1,
  "isActive": true
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | min 2 chars |
| `description` | string | — |
| `sortOrder` | integer | min 0 |
| `isActive` | boolean | — |

**Response `200`** — updated category object.

**Errors**: `401`, `403`, `404`.

---

### `DELETE /api/v1/categories/:id`

Delete a category.

- **Auth**: Bearer — `ADMIN`

**Response `204`** — no content.

**Errors**: `401`, `403`, `404`.

---

## Products

Base path: `/api/v1/products`

### `GET /api/v1/products`

List products with pagination, optionally filtered by category.

- **Auth**: Public

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | no | default `1` |
| `limit` | integer | no | default `20`, max `100` |
| `categoryId` | UUID | no | Filter by category |

**Response `200`** — paginated list of products.

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "categoryId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Cappuccino",
      "description": "Espresso with steamed milk",
      "price": "12.50",
      "imageUrl": "https://example.com/cappuccino.jpg",
      "isAvailable": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
}
```

---

### `GET /api/v1/products/:id`

Get a single product by ID.

- **Auth**: Public

**Response `200`** — product object (same shape as list item above).

**Errors**: `404` — product not found.

---

### `POST /api/v1/products`

Create a new product.

- **Auth**: Bearer — `ADMIN`

**Request body**

```json
{
  "categoryId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "name": "Espresso",
  "description": "Traditional espresso",
  "price": "5.50",
  "imageUrl": "https://cdn.kafe.com/espresso.jpg",
  "isAvailable": true
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `categoryId` | UUID | yes | must exist |
| `name` | string | yes | min 2 chars |
| `description` | string | no | — |
| `price` | string | yes | decimal string, max `99999.99` (e.g. `"5.50"`) |
| `imageUrl` | string | no | — |
| `isAvailable` | boolean | no | default `true` |

**Response `201`** — created product object.

**Errors**: `401`, `403`.

---

### `PATCH /api/v1/products/:id`

Update a product.

- **Auth**: Bearer — `ADMIN`

**Request body** (all fields optional, same fields as create)

**Response `200`** — updated product object.

**Errors**: `401`, `403`, `404`.

---

### `DELETE /api/v1/products/:id`

Delete a product.

- **Auth**: Bearer — `ADMIN`

**Response `204`** — no content.

**Errors**: `401`, `403`, `404`.

---

### `PATCH /api/v1/products/:id/availability`

Toggle the `isAvailable` flag of a product.

- **Auth**: Bearer — `ADMIN`

**Request body**: none.

**Response `200`** — updated product object.

**Errors**: `401`, `403`, `404`.

---

### `GET /api/v1/products/:id/ingredients`

List all ingredients in a product's recipe.

- **Auth**: Bearer — `ADMIN`

**Response `200`**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "ingredientId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "quantity": "30.000"
  }
]
```

**Errors**: `401`, `403`, `404`.

---

### `POST /api/v1/products/:id/ingredients`

Add an ingredient to a product's recipe.

- **Auth**: Bearer — `ADMIN`

**Request body**

```json
{
  "ingredientId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "quantity": "0.030"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `ingredientId` | UUID | yes | must exist |
| `quantity` | string | yes | positive decimal string (e.g. `"0.030"`) |

**Response `201`** — product-ingredient record.

**Errors**: `401`, `403`, `404` — product or ingredient not found.

---

### `DELETE /api/v1/products/:id/ingredients/:ingredientId`

Remove an ingredient from a product's recipe.

- **Auth**: Bearer — `ADMIN`

**Response `204`** — no content.

**Errors**: `401`, `403`, `404` — product-ingredient relation not found.

---

## Orders

Base path: `/api/v1/orders`

### `POST /api/v1/orders`

Create a new order. Works for anonymous and authenticated users.

- **Auth**: Public (optionally authenticated)

**Request body**

```json
{
  "clientName": "John Silva",
  "notes": "No sugar",
  "items": [
    { "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "quantity": 2 }
  ]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `clientName` | string | no | max 255 chars; ignored if authenticated (name comes from user session) |
| `notes` | string | no | — |
| `items` | array | yes | min 1 item |
| `items[].productId` | UUID | yes | must exist and be available |
| `items[].quantity` | integer | yes | min 1 |

**Response `201`**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "clientId": null,
  "clientName": "John Silva",
  "baristaId": null,
  "status": "RECEIVED",
  "notes": "No sugar",
  "totalAmount": "25.00",
  "items": [
    {
      "id": "...",
      "orderId": "...",
      "productId": "...",
      "productName": "Cappuccino",
      "unitPrice": "12.50",
      "quantity": 2,
      "subtotal": "25.00"
    }
  ],
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

**Errors**: `400` — invalid data or insufficient stock.

---

### `GET /api/v1/orders`

List all orders with optional filters (admin overview).

- **Auth**: Bearer — `ADMIN`

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | no | default `1` |
| `limit` | integer | no | default `20`, max `100` |
| `status` | string | no | One of `RECEIVED`, `IN_PREPARATION`, `READY`, `DELIVERED`, `CANCELLED` |
| `from` | ISO 8601 date | no | Filter by creation date (start) |
| `to` | ISO 8601 date | no | Filter by creation date (end) |

**Response `200`** — paginated list of orders.

**Errors**: `401`, `403`.

---

### `GET /api/v1/orders/queue`

Get the barista queue — active orders pending preparation (status `RECEIVED` or `IN_PREPARATION`).

- **Auth**: Bearer — `BARISTA`, `ADMIN`

**Response `200`** — array of order objects.

**Errors**: `401`, `403`.

---

### `GET /api/v1/orders/me`

Get the authenticated user's own order history.

- **Auth**: Bearer — any authenticated role

**Query parameters**: `page`, `limit`

**Response `200`** — paginated list of orders belonging to the current user.

**Errors**: `401`.

---

### `GET /api/v1/orders/:id`

Get a single order by ID.

- **Auth**: Bearer — `ADMIN`, `BARISTA`

**Response `200`** — order object.

**Errors**: `401`, `403`, `404`.

---

### `PATCH /api/v1/orders/:id/status`

Update the status of an order. Status must follow a valid transition.

- **Auth**: Bearer — `BARISTA`, `ADMIN`

**Valid status transitions**

```
RECEIVED → IN_PREPARATION → READY → DELIVERED
         ↘                         ↗
           CANCELLED (from RECEIVED or IN_PREPARATION)
```

**Request body**

```json
{
  "status": "IN_PREPARATION"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | yes | `RECEIVED`, `IN_PREPARATION`, `READY`, `DELIVERED`, `CANCELLED` |

**Response `200`** — updated order object.

**Errors**: `400` — invalid transition, `401`, `403`, `404`.

---

## Inventory

Base path: `/api/v1/inventory`

All inventory endpoints require authentication. The table below summarises access per role:

| Endpoint | ADMIN | BARISTA |
|----------|-------|---------|
| List ingredients | yes | yes |
| Get ingredient | yes | yes |
| Stock alerts | yes | yes |
| Create ingredient | yes | no |
| Update ingredient | yes | no |
| Restock | yes | no |
| List movements | yes | no |

---

### `GET /api/v1/inventory`

List all ingredients with pagination.

- **Auth**: Bearer — `ADMIN`, `BARISTA`

**Query parameters**: `page`, `limit`

**Response `200`**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Espresso Coffee",
      "unit": "ml",
      "currentStock": "5000.000",
      "minimumStock": "500.000",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
}
```

**Errors**: `401`, `403`.

---

### `GET /api/v1/inventory/alerts`

List ingredients whose `currentStock` is below `minimumStock`.

- **Auth**: Bearer — `ADMIN`, `BARISTA`

**Response `200`** — array of ingredient objects (same shape as list item above).

**Errors**: `401`, `403`.

---

### `GET /api/v1/inventory/:id`

Get a single ingredient by ID.

- **Auth**: Bearer — `ADMIN`, `BARISTA`

**Response `200`** — ingredient object.

**Errors**: `401`, `403`, `404`.

---

### `POST /api/v1/inventory`

Create a new ingredient.

- **Auth**: Bearer — `ADMIN`

**Request body**

```json
{
  "name": "Coffee",
  "unit": "kg",
  "currentStock": "10.000",
  "minimumStock": "2.000"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | min 2 chars |
| `unit` | string | yes | e.g. `"kg"`, `"ml"`, `"g"` |
| `currentStock` | string | no | decimal string, max `999999` (e.g. `"10.000"`) |
| `minimumStock` | string | no | decimal string, max `999999` |

**Response `201`** — created ingredient object.

**Errors**: `401`, `403`.

---

### `PATCH /api/v1/inventory/:id`

Update an ingredient's metadata.

- **Auth**: Bearer — `ADMIN`

**Request body** (all fields optional, same fields as create)

**Response `200`** — updated ingredient object.

**Errors**: `401`, `403`, `404`.

---

### `POST /api/v1/inventory/:id/restock`

Add stock to an ingredient and record a `RESTOCK` movement.

- **Auth**: Bearer — `ADMIN`

**Request body**

```json
{
  "quantity": "5.000",
  "note": "Weekly delivery"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `quantity` | string | yes | positive decimal string, max `999999` |
| `note` | string | no | — |

**Response `200`** — updated ingredient object with new `currentStock`.

**Errors**: `401`, `403`, `404`.

---

### `GET /api/v1/inventory/movements`

List stock movement history with optional filters.

- **Auth**: Bearer — `ADMIN`

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | no | default `1` |
| `limit` | integer | no | default `20`, max `100` |
| `ingredientId` | UUID | no | Filter by ingredient |
| `orderId` | UUID | no | Filter by originating order |
| `from` | ISO 8601 date | no | Filter by date (start) |
| `to` | ISO 8601 date | no | Filter by date (end) |

**Response `200`**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "ingredientId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "orderId": null,
      "type": "RESTOCK",
      "quantity": "500.000",
      "note": "Weekly restock",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

Movement types: `DEDUCTION` (auto-generated when an order is placed), `RESTOCK` (manual), `ADJUSTMENT`.

**Errors**: `401`, `403`.

---

## Users

Base path: `/api/v1/users`

All endpoints require `ADMIN` role.

### `GET /api/v1/users`

List all users with pagination.

- **Auth**: Bearer — `ADMIN`

**Query parameters**: `page`, `limit`

**Response `200`**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Maria Silva",
      "email": "maria@example.com",
      "role": "CLIENT",
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

**Errors**: `401`, `403`.

---

### `GET /api/v1/users/:id`

Get a single user by ID.

- **Auth**: Bearer — `ADMIN`

**Response `200`** — user object (same shape as list item above).

**Errors**: `401`, `403`, `404`.

---

### `POST /api/v1/users`

Create a new user.

- **Auth**: Bearer — `ADMIN`

**Request body**

```json
{
  "name": "Maria Silva",
  "email": "maria@kafe.com",
  "password": "secret1234",
  "role": "CLIENT"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | min 2 chars |
| `email` | string | yes | valid email |
| `password` | string | yes | min 12 chars |
| `role` | string | no | `ADMIN`, `BARISTA`, or `CLIENT` (default `CLIENT`) |

**Response `201`** — created user object (password not returned).

**Errors**: `401`, `403`, `409` — email already registered.

---

### `PATCH /api/v1/users/:id`

Update a user.

- **Auth**: Bearer — `ADMIN`

**Request body** (all fields optional)

```json
{
  "name": "Maria Oliveira",
  "role": "BARISTA",
  "isActive": false
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | min 2 chars |
| `role` | string | `ADMIN`, `BARISTA`, `CLIENT` |
| `isActive` | boolean | — |

**Response `200`** — updated user object.

**Errors**: `401`, `403`, `404`.

---

### `DELETE /api/v1/users/:id`

Delete a user.

- **Auth**: Bearer — `ADMIN`

**Response `204`** — no content.

**Errors**: `401`, `403`, `404`.

---

## Dashboard

Base path: `/api/v1/dashboard`

All endpoints require `ADMIN` role. All endpoints accept an optional date range filter via `from` and `to` query parameters (ISO 8601 date strings).

### `GET /api/v1/dashboard/summary`

Sales summary for a given period.

- **Auth**: Bearer — `ADMIN`

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | ISO 8601 date | no | Period start |
| `to` | ISO 8601 date | no | Period end |

**Response `200`**

```json
{
  "totalOrders": 42,
  "totalRevenue": "1250.00",
  "avgOrderValue": "29.76",
  "ordersByStatus": {
    "RECEIVED": 5,
    "IN_PREPARATION": 3,
    "READY": 2,
    "DELIVERED": 30,
    "CANCELLED": 2
  }
}
```

**Errors**: `401`, `403`.

---

### `GET /api/v1/dashboard/top-products`

Most sold products in a given period.

- **Auth**: Bearer — `ADMIN`

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | ISO 8601 date | no | Period start |
| `to` | ISO 8601 date | no | Period end |
| `limit` | integer | no | Max results, default `10`, max `50` |

**Response `200`**

```json
[
  {
    "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "productName": "Cappuccino",
    "quantitySold": 85,
    "revenue": "1062.50"
  }
]
```

**Errors**: `401`, `403`.

---

### `GET /api/v1/dashboard/peak-hours`

Order count grouped by hour of the day.

- **Auth**: Bearer — `ADMIN`

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | ISO 8601 date | no | Period start |
| `to` | ISO 8601 date | no | Period end |

**Response `200`**

```json
[
  { "hour": 9, "orderCount": 34 },
  { "hour": 10, "orderCount": 51 }
]
```

`hour` is in 24-hour format (0–23).

**Errors**: `401`, `403`.
