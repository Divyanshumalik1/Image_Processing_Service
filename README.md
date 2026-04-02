# 🧠 Image Processing Service

> A full-stack image processing service inspired by Cloudinary. Upload, transform, and retrieve images securely with custom JWT authentication and AWS S3 storage.

📎 **Project Spec:** [roadmap.sh — Image Processing Service](https://roadmap.sh/projects/image-processing-service)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)

---

## 📌 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Authentication System](#-authentication-system)
- [API Routes](#-api-routes)
- [Backend Deep Dive](#-backend-deep-dive)
  - [File Upload Controller](#-file-upload-controller)
  - [File Retrieval Controller](#-file-retrieval-controller)
  - [Get All Images (Paginated)](#-get-all-images-paginated)
  - [Image Transformation Controller](#-image-transformation-controller)
- [Frontend Flow](#-frontend-flow)
- [Database Schema](#-database-schema)
- [CURL Examples](#-curl-examples)
- [Future Improvements](#-future-improvements)
- [What You Learn](#-what-you-learn)

---

## 🚀 Features

### 🔐 Authentication
- User Signup & Login
- Custom JWT implementation (built from scratch — no external JWT libraries)
- Protected routes via middleware
- Secure password hashing with `crypto`

### 🖼️ Image Management
- Upload images directly to AWS S3
- Store and query metadata in MongoDB
- Retrieve a single image (ownership-protected, streamed efficiently)
- Retrieve all images with pagination

### ⚙️ Image Transformations (via Sharp)
| Transform | Options |
|---|---|
| Resize | `width`, `height` |
| Crop | `x`, `y`, `width`, `height` |
| Rotate | degrees |
| Format | `jpeg`, `png`, etc. |
| Grayscale | boolean |
| Sepia | boolean |

---

## 🏗️ System Architecture

```
React Frontend
      ↓
Express Backend (Node.js)
      ↓
JWT Auth Middleware
      ↓
Controllers (Business Logic)
      ↓
MongoDB (Metadata) + AWS S3 (Image Files)
```

---

## 🔐 Authentication System

### How JWT Works

A JWT is composed of three Base64URL-encoded parts separated by dots:

```
HEADER.PAYLOAD.SIGNATURE
```

Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJ1c2VybmFtZSI6ImRtYWxpazEiLCJleHAiOjE3NzM4MDk4NjcsImlhdCI6MTc3MzgwNjI2N30
.SIGNATURE
```

### Step-by-Step Auth Flow

1. Client sends `{ username, password }` to `/login`
2. Backend verifies credentials against the database
3. Backend generates a signed JWT using user data **from the DB**
4. Client stores the token in `localStorage`
5. Every subsequent request includes: `Authorization: Bearer <token>`
6. Middleware validates signature, expiry, and payload on every protected route

### ⚠️ Critical Security Rule

> **NEVER build the JWT payload from client input (`req.body`).**

If you trust the client's payload, a malicious user could send:
```json
{ "username": "admin" }
```
...and impersonate an admin.

✅ **Correct approach:** Always fetch user data from the database first, then build the token payload from the DB result:

```js
const user = await User.findOne({ username, password: hashedPassword });
const token = tokengenerator(user); // uses user data FROM DB, not req.body
```

---

### Token Generator — Line by Line

```js
function tokengenerator(newUser) {
```

**Base64URL Helper** — JWT requires Base64URL encoding, not standard Base64:
```js
const base64Url = (str) =>
  str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
// Standard Base64 uses: +  /  =
// JWT requires:         -  _  (no padding)
```

**Header:**
```js
const header = { alg: "HS256", typ: "JWT" };
// alg: HMAC SHA-256 signing algorithm
// typ: token type identifier
```

**Payload:**
```js
const payload = {
  username: newUser.username,  // user identity
  userId: newUser._id,         // MongoDB document ID
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,  // expires in 6 hours
  iat: Math.floor(Date.now() / 1000),                  // issued at (now)
};
```

**Encode Header and Payload:**
```js
const base64UrlEncodeHeader = base64Url(
  Buffer.from(JSON.stringify(header)).toString("base64")
);
// Steps: JS Object → JSON string → Base64 → Base64URL
```

**Create Signature:**
```js
const text = `${base64UrlEncodeHeader}.${base64UrlEncodePayload}`;

const signature = crypto
  .createHmac("sha256", secretKey)  // create HMAC instance
  .update(text)                      // feed in header.payload
  .digest("base64url");              // output as Base64URL
```

> The secret key must be stored in `.env`. It ensures only your server can produce a valid signature. If anyone tampers with the header or payload, the signature won't match.

**Final Token:**
```js
const token = `${header}.${payload}.${signature}`;
```

---

### Login Controller

```js
const { username, password } = req.body;

// Hash the incoming password for comparison
const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

// Look up user in DB
const DatainDB = await User.findOne({ username, password: hashedPassword });

if (!DatainDB) {
  return res.status(401).json({ message: "Invalid username or password" });
}

const token = tokengenerator(DatainDB);
res.status(200).json({ message: "Login successful", token });
```

### Signup Controller

```js
const Userdata = req.body;

if (Userdata.password !== Userdata.confirmPassword) { /* 400 */ }

const existing = await User.findOne({ username, email, phone });
if (existing) { /* 409 Conflict */ }

const newUser = new User(Userdata);
newUser.password = crypto.createHash("sha256").update(newUser.password).digest("hex");
await newUser.save();

const token = tokengenerator(newUser);
res.status(201).json({ message: "Signup successful", token });
```

---

### Auth Middleware

Protects every image route. Called before any controller runs.

```js
// 1. Check Authorization header exists
const authHeader = req.headers.authorization;
if (!authHeader) return res.status(401).json({ message: "No token provided" });

// 2. Extract token from "Bearer <token>"
const token = authHeader.split(" ")[1];

// 3. Split into parts
const [headerEncoded, payloadEncoded, signatureReceived] = token.split(".");

// 4. Decode payload
const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString());

// 5. Check expiry
if (Math.floor(Date.now() / 1000) > payload.exp) {
  return res.status(401).json({ message: "Token expired" });
}

// 6. Recreate signature and compare
const expectedSig = crypto
  .createHmac("sha256", secretKey)
  .update(`${headerEncoded}.${payloadEncoded}`)
  .digest("base64url");

if (expectedSig !== signatureReceived) {
  return res.status(401).json({ message: "Invalid token" });
}

// 7. Attach decoded payload to request for use in controllers
req.user = payload; // { username, userId, exp, iat }
next();
```

---

## 🗂️ API Routes

### Auth Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |

### Image Routes
| Method | Route | Auth Required | Description |
|--------|-------|:---:|-------------|
| POST | `/file/images` | ✅ | Upload an image |
| GET | `/file/images/:id` | ✅ | Retrieve a single image (streamed) |
| GET | `/file/images` | ✅ | Get all images (paginated) |
| POST | `/file/images/:id/transform` | ✅ | Apply transformations |

---

## 🔍 Backend Deep Dive

### 📤 File Upload Controller

**Full flow:**
```
Client → Multer (memory buffer) → S3 upload → MongoDB metadata save → Response
```

#### 1. Extract File from Multer

```js
const file = req.file;
// Contains: file.buffer, file.mimetype, file.size
// Multer stores the file in RAM (memoryStorage), not on disk
```

Multer is configured with:
```js
multer.memoryStorage()         // keep file in memory as a buffer
limits: { fileSize: 100 * 1024 * 1024 }  // 100MB max
uploadMiddleware.single("file")           // accept one file per request, field name "file"
```

#### 2. Extract User from JWT Middleware

```js
const payload = req.user;
// { username, userId, exp, iat }
// userId is the MongoDB ObjectId (as a string) of the authenticated user
```

#### 3. Validate Inputs

```js
if (!payload) return res.status(401).json({ message: "Unauthorized" });
if (!file)    return res.status(400).json({ message: "No file uploaded" });
```

#### 4. Generate a Unique S3 Key

```js
const fileName = `${uuidv4()}`;
// Example: "3f6a1b2c-7d4e-4f8a-b0c1-2e3d4f5a6b7c"
// UUID v4 guarantees global uniqueness — no collisions, no overwrites
```

#### 5. Build the S3 Upload Command

```js
const command = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,  // your S3 bucket
  Key: fileName,                        // unique filename (no path prefix here)
  Body: file.buffer,                    // raw binary data from multer
  ContentType: file.mimetype,           // e.g. "image/png", "image/jpeg"
});
```

| Field | Purpose |
|---|---|
| `Bucket` | Target S3 bucket |
| `Key` | The object name/path inside S3 |
| `Body` | Raw binary content of the file |
| `ContentType` | Tells S3 (and browsers) the MIME type |

#### 6. Execute the Upload

```js
await s3.send(command);
// Sends the PutObjectCommand to AWS — file is now stored in S3
```

The `S3Client` is initialized once at module level:
```js
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

All AWS credentials must live in `.env` — **never hardcode them**.

#### 7. Construct the Public URL

```js
const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
```

This URL follows AWS's standard S3 path format and can be used to access the object directly (if the bucket/object is public) or embedded in your own retrieval endpoint.

#### 8. Save Metadata to MongoDB

```js
const image = new Image({
  userId: req.user.userId,  // links image to the authenticated user
  key: fileName,            // S3 object key — used to retrieve/delete from S3 later
  url: fileUrl,             // pre-computed public URL
  contentType: file.mimetype,
  size: file.size,
});
await image.save();
```

> **Why store metadata in MongoDB if the file is in S3?**
> - Enables ownership checks (is this user allowed to see/transform this image?)
> - Avoids expensive S3 LIST operations to find files
> - Supports pagination, filtering, and search
> - Stores additional context (size, type, upload date) that S3 alone doesn't expose easily

#### 9. Send Response

```json
{
  "message": "File uploaded successfully",
  "imageId": "64abc123...",
  "userId": "64def456...",
  "url": "https://bucket.s3.amazonaws.com/uuid"
}
```

---

### 📥 File Retrieval Controller

**Full flow:**
```
Client → MongoDB (get S3 key) → S3 (stream object) → Client
```

```js
// 1. Get MongoDB image document ID from URL param
const imageId = req.params.id;

// 2. Find image metadata in MongoDB
const image = await Image.findById(imageId);
if (!image) return res.status(404).json({ message: "Image not found" });

// 3. Authorization: only the owner can retrieve their image
if (image.userId.toString() !== req.user.userId.toString()) {
  return res.status(403).json({ message: "Unauthorized" });
}
```

> **Why `.toString()` on both sides?**
> MongoDB stores `userId` as an `ObjectId` object. The JWT payload stores it as a plain string. A direct `!==` comparison between `ObjectId` and `String` will always fail — even if they represent the same value. `.toString()` normalizes both to strings before comparison.

```js
// 4. Build and send GetObjectCommand to S3
const command = new GetObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: image.key,  // S3 object key stored in MongoDB
});
const response = await s3.send(command);

// 5. Set response headers and stream file to client
res.setHeader("Content-Type", response.ContentType);
res.setHeader("Content-Disposition", `inline; filename="${image.key}"`);
response.Body.pipe(res);  // stream directly — no memory buffer needed
```

> **Why stream instead of buffering?**
> Large image files could exhaust server memory if loaded entirely into RAM. Streaming pipes data chunk-by-chunk from S3 directly to the HTTP response — efficient, scalable, and fast.

---

### 📚 Get All Images (Paginated)

```
GET /file/images?page=1&limit=10
```

```js
const pageNumber = parseInt(req.query.page) || 1;
const pageLimit  = parseInt(req.query.limit) || 10;
const skip       = (pageNumber - 1) * pageLimit;

const imagesMetadata = await Image.find()
  .sort({ createdAt: -1 })  // newest first
  .skip(skip)
  .limit(pageLimit);

const total = await Image.countDocuments();

res.json({
  images: imagesMetadata,
  page: pageNumber,
  limit: pageLimit,
  total,
  totalPages: Math.ceil(total / pageLimit),
});
```

**Example response:**
```json
{
  "images": [...],
  "page": 1,
  "limit": 10,
  "total": 47,
  "totalPages": 5
}
```

---

### ⚙️ Image Transformation Controller

**Full flow:**
```
Client → MongoDB (get S3 key) → S3 (download image)
      → Sharp (apply transforms) → S3 (upload new image)
      → MongoDB (update metadata) → Response
```

#### 1. Fetch Metadata and Authorize

```js
const image = await Image.findOne({ _id: imageid });
if (!image) return res.status(404).json({ error: "Data not found" });
if (image.userId.toString() !== req.user.userId.toString()) {
  return res.status(403).json({ message: "Unauthorized" });
}
```

#### 2. Download Image from S3

```js
const imageData = await s3.send(new GetObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: image.key,
}));
```

#### 3. Convert S3 Stream to Buffer

```js
const chunks = [];
for await (const chunk of imageData.Body) {
  chunks.push(chunk);
}
const buffer = Buffer.concat(chunks);
```

> S3 returns a readable stream. Sharp requires a Buffer. This loop collects all stream chunks and concatenates them into a single Buffer for Sharp to process.

#### 4. Initialize Sharp and Apply Transformations

```js
let img = sharp(buffer);
const t = req.body.transformations;
```

| Transform | Code | Notes |
|---|---|---|
| Resize | `img.resize({ width, height })` | Scales image; aspect ratio maintained by default |
| Crop | `img.extract({ left: x, top: y, width, height })` | Crops a rectangular region |
| Rotate | `img.rotate(degrees)` | Rotates clockwise; background filled automatically |
| Grayscale | `img.grayscale()` | Converts to black and white |
| Sepia | `img.modulate({ saturation: 0.5, hue: 30 })` | Warm brownish tone effect |
| Format | `img.toFormat("png")` | Converts output format |

```js
if (t?.resize)          img = img.resize({ width: t.resize.width, height: t.resize.height });
if (t?.crop)            img = img.extract({ left: t.crop.x, top: t.crop.y, width: t.crop.width, height: t.crop.height });
if (t?.rotate)          img = img.rotate(t.rotate);
if (t?.filters?.grayscale) img = img.grayscale();
if (t?.filters?.sepia)  img = img.modulate({ saturation: 0.5, hue: 30 });

const format = t?.format || "jpeg";
img = img.toFormat(format);

const outputBuffer = await img.toBuffer();
```

#### 5. Upload Transformed Image to S3

```js
const newKey = `images/${uuidv4()}.${format}`;

await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: newKey,
  Body: outputBuffer,
  ContentType: `image/${format}`,
}));

const newUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${newKey}`;
```

> A new UUID key is generated for the transformed image so it is stored as a separate object in S3, independent of the original.

#### 6. Update MongoDB Metadata

```js
image.key = newKey;
image.url = newUrl;
await image.save();
```

> ⚠️ **Design note:** This overwrites the original image's metadata. For production, consider a versioning system that stores original + each transformed version separately, allowing rollback.

#### 7. Response

```json
{
  "message": "Transformed successfully",
  "url": "https://bucket.s3.amazonaws.com/images/uuid.png",
  "key": "images/uuid.png",
  "metadata": {
    "size": 204800,
    "format": "png"
  }
}
```

#### Example Transform Request Body

```json
{
  "transformations": {
    "resize": { "width": 200, "height": 200 },
    "rotate": 90,
    "format": "png",
    "filters": {
      "grayscale": true
    }
  }
}
```

---

## 🌐 Frontend Flow

### Login

```js
const res = await fetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
const data = await res.json();
localStorage.setItem("token", data.token);
```

### Upload

```js
const formData = new FormData();
formData.append("file", file);

fetch("/file/images", {
  method: "POST",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  body: formData,
});
```

### Preview Before Upload

```js
const previewUrl = URL.createObjectURL(file);
// Use as <img src={previewUrl} /> — no server round-trip needed
```

### Transform

```js
fetch(`/file/images/${imageId}/transform`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    transformations: { resize: { width: 300, height: 300 }, format: "png" },
  }),
});
```

---

## 🧾 Database Schema

### Image

```js
{
  userId:      ObjectId,   // reference to User — owner of this image
  key:         String,     // S3 object key — used to retrieve/delete from S3
  url:         String,     // pre-signed or public S3 URL
  contentType: String,     // MIME type (e.g. "image/jpeg")
  size:        Number,     // file size in bytes
  createdAt:   Date,       // auto-managed by Mongoose timestamps
}
```

### User

```js
{
  username: String,   // unique login identifier
  password: String,   // SHA-256 hashed (bcrypt recommended for production)
  email:    String,
  phone:    String,
}
```

---

## 🧪 CURL Examples

**Upload an image:**
```bash
curl -X POST http://localhost:3000/file/images \
  -H "Authorization: Bearer <token>" \
  -F "file=@image.png"
```

**Retrieve an image (saves to file):**
```bash
curl -X GET http://localhost:3000/file/images/<imageId> \
  -H "Authorization: Bearer <token>" \
  --output downloaded.png
```

**Apply a transformation:**
```bash
curl -X POST http://localhost:3000/file/images/<imageId>/transform \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transformations": {"resize": {"width": 200, "height": 200}, "format": "png"}}'
```

---

## ⚡ Future Improvements

### 🔐 Security
- Replace `crypto` SHA-256 with **bcrypt** for password hashing (bcrypt is intentionally slow, making brute-force attacks impractical)
- Add **refresh tokens** (short-lived access tokens + long-lived refresh tokens)
- Add **rate limiting** on auth routes to prevent brute-force
- Input validation with **Joi** or **Zod**
- Structured logging with **Winston** or **Pino**

### 🚀 Scalability
- **Job queues** (BullMQ, RabbitMQ, Kafka) for async image transformation — offload processing from the request cycle
- **CDN** (CloudFront) in front of S3 for faster global delivery
- **Pre-signed S3 URLs** — let clients upload directly to S3, bypassing your server entirely
- **Image versioning** — store original + all transformed versions, support rollback

### 🖼️ Advanced Features
- Watermarking
- Face detection & auto-crop
- AI-powered filters
- Webhook callbacks when transforms complete

---

## 🧠 What You Learn From This Project

| Concept | Skill Level |
|---|---|
| JWT implementation from scratch | 🔥 Rare & valuable |
| Secure backend design patterns | Advanced |
| AWS S3 integration (upload + streaming retrieval) | Practical cloud skills |
| Sharp image processing pipeline | Applied |
| MongoDB ↔ S3 dual-storage architecture | System design |
| Full-stack auth flow | Foundational |

---

## 🏁 Conclusion

This project is a **mini Cloudinary clone** and a practical **backend system design exercise**. It demonstrates real-world patterns used in production image services: dual-storage (object store + metadata DB), JWT-based auth, streaming responses, and a pluggable transformation pipeline.

> Built from scratch. No JWT libraries. No magic — just Node.js, crypto, Sharp, S3, and MongoDB.
