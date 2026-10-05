# Library API Design

A REST API for managing a library's `books` resource.

Base URL: `https://api.example.com`

---

## Endpoints

### 1. List all books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Request body:** None
- **Success status:** `200 OK`

---

### 2. Get one book

- **Method:** GET
- **Path:** `/books/:id`
- **Description:** Returns a single book by its ID.
- **Request body:** None
- **Success status:** `200 OK`

---

### 3. Create a book

- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958
  }