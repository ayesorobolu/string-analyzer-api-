# String Analyzer Service

A RESTful API service that analyzes strings and stores their computed properties. Built with Node.js and Express.

## Features

- Analyze strings and compute properties (length, palindrome check, character frequency, etc.)
- Store analyzed strings in memory
- Filter strings by various criteria
- Natural language query support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository

```bash
git clone https://github.com/ayesorobolu/string-analyzer-api-
cd string-analyzer-api-
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=[specify PORT number]

```

4. Start the server

```bash
npm start
```

The server will run on `http://localhost:4050` (or the PORT specified in .env).

## API Endpoints

### 1. Create/Analyze String

**Endpoint:** `POST /strings`

**Description:** Analyzes a string and stores it with computed properties.

**Request Body:**

```json
{
  "value": "string to analyze"
}
```

**Success Response (201 Created):**

```json
{
  "id": "sha256_hash_value",
  "value": "string to analyze",
  "properties": {
    "length": 17,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "s": 2,
      "t": 3,
      "r": 2
    }
  },
  "created_at": "2025-10-22T10:00:00Z"
}
```

**Error Responses:**

- `409 Conflict`: String already exists
- `400 Bad Request`: Missing "value" field
- `422 Unprocessable Entity`: Invalid data type for "value"

---

### 2. Get Specific String

**Endpoint:** `GET /strings/:string_value`

**Description:** Retrieves a specific string by its value.

**Example:** `GET /strings/hello`

**Success Response (200 OK):**

```json
{
  "id": "sha256_hash_value",
  "value": "hello",
  "properties": {
    "length": 5,
    "is_palindrome": false,
    "unique_characters": 4,
    "word_count": 1,
    "sha256_hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    "character_frequency_map": {
      "h": 1,
      "e": 1,
      "l": 2,
      "o": 1
    }
  },
  "created_at": "2025-10-22T10:00:00Z"
}
```

**Error Response:**

- `404 Not Found`: String does not exist

---

### 3. Get All Strings with Filtering

**Endpoint:** `GET /strings`

**Description:** Retrieves all strings with optional filtering.

**Query Parameters:**

- `is_palindrome` (boolean): Filter by palindrome status
- `min_length` (integer): Minimum string length
- `max_length` (integer): Maximum string length
- `word_count` (integer): Exact word count
- `contains_character` (string): Single character to search for

**Examples:**

- `GET /strings` - Get all strings
- `GET /strings?is_palindrome=true` - Get only palindromes
- `GET /strings?min_length=5&max_length=10` - Get strings 5-10 chars
- `GET /strings?word_count=2&contains_character=a` - Get 2-word strings with 'a'

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "hash1",
      "value": "racecar",
      "properties": {
        "length": 7,
        "is_palindrome": true,
        "unique_characters": 5,
        "word_count": 1,
        "sha256_hash": "hash1",
        "character_frequency_map": {
          "r": 2,
          "a": 2,
          "c": 2,
          "e": 1
        }
      },
      "created_at": "2025-10-22T10:00:00Z"
    }
  ],
  "count": 1,
  "filters_applied": {
    "is_palindrome": true
  }
}
```

**Error Response:**

- `400 Bad Request`: Invalid query parameter values

---

### 4. Natural Language Filtering

**Endpoint:** `GET /strings/filter-by-natural-language`

**Description:**  Filter strings using natural language queries.

**Query Parameter:**

- `query` (string): natural language text describing what to filter.

**Supported Queries:**

- "all single word palindromic strings"
- "strings longer than 10 characters"
- "strings shorter than 5 characters"
- "palindromic strings that contain the first vowel"
- "strings containing the letter z"
- "two word strings"

**Example:**

```
GET /strings/filter-by-natural-language?query=all single word palindromic strings
```

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "hash1",
      "value": "racecar",
      "properties": { ... },
      "created_at": "2025-10-22T10:00:00Z"
    }
  ],
  "count": 1,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Unable to parse query or missing query parameter
- `422 Unprocessable Entity`: Query parsed but resulted in conflicting filters

---

### 5. Delete String

**Endpoint:** `DELETE /strings/:string_value`

**Description:** Deletes a specific string from the system.

**Example:** `DELETE /strings/hello`

**Success Response:** `204 No Content` 

**Error Response:**

- `404 Not Found`: String does not exist

---

## Computed String Properties

For each analyzed string, the following properties are computed:

| Property                  | Type    | Description                                                                                 |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `length`                  | number  | Total number of characters in the string                                                    |
| `is_palindrome`           | boolean | Whether the string reads the same forwards and backwards (case-insensitive, ignores spaces) |
| `unique_characters`       | number  | Count of distinct characters in the string                                                  |
| `word_count`              | number  | Number of words separated by whitespace                                                     |
| `sha256_hash`             | string  | SHA-256 hash of the string (used as unique ID)                                              |
| `character_frequency_map` | object  | Object mapping each character to its occurrence count                                       |

---

## Project Structure

```
string-analyzer-service/
├── src/
│   ├── server.js                    # Express app entry point
│   ├── controllers/
│   │   └── stringsController.js      # Business logic for all endpoints
│   ├── routes/
│       └── stringsRoutes.js          # Route definitions      
│ 
├── package.json
├── .gitignore
└── README.md
```

---

## Testing with Postman/cURL

### Example: Create a string

```bash
curl -X POST http://localhost:3005/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "racecar"}'
```

### Example: Get a specific string

```bash
curl http://localhost:3005/strings/racecar
```

### Example: Get all palindromes

```bash
curl "http://localhost:3005/strings?is_palindrome=true"
```

### Example: Natural language query

```bash
curl "http://localhost:3005/strings/filter-by-natural-language?query=single%20word%20palindromic%20strings"
```

### Example: Delete a string

```bash
curl -X DELETE http://localhost:3005/strings/racecar
```

---

## Technical Details

- **Storage:** In-memory (data is lost when server restarts)
- **Port:** 4050 by default (configurable via `.env` file)
- **Framework:** Express.js v5.1.0
- **Environment Variables:** Managed with dotenv
- **ID Generation:** SHA-256 hash of the string value ensures uniqueness
- **Encoding:**  URL-safe for strings with spaces/special characters

---

## Error Handling

The API uses standard HTTP status codes:

| Status Code              | Meaning                                       |
| ------------------------ | --------------------------------------------- |
| 200 OK                   | Successful GET request                        |
| 201 Created              | Successfully created new resource             |
| 204 No Content           | Successfully deleted resource                 |
| 400 Bad Request          | Malformed request or missing required fields  |
| 404 Not Found            | Resource not found                            |
| 409 Conflict             | Resource already exists                       |
| 422 Unprocessable Entity | Request is valid but contains semantic errors |

---

## Development

### Running in Development

```bash
npm run dev
```

### Project Dependencies

- **express**: Web framework for Node.js
- **dotenv**: Environment variable management

---
