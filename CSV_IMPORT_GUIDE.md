# CSV Import Guide

## Overview
Import contacts in bulk from CSV files with comprehensive validation, error handling, and duplicate detection.

## Features

✅ **Validation**
- Email format validation
- Duplicate detection (within CSV and database)
- File size limits (5MB max)
- Row limits (10,000 max)
- Column validation

✅ **Error Handling**
- Detailed error messages per row
- Warnings for non-critical issues
- Skip invalid rows option
- Update existing contacts option

✅ **Data Processing**
- Automatic email normalization
- Tag parsing from comma/semicolon separated values
- Custom fields extraction
- Status validation

---

## CSV Format

### Required Columns
- `email` (required) - Contact email address

### Optional Columns
- `firstName` or `first_name` - Contact first name
- `lastName` or `last_name` - Contact last name
- `tags` - Comma-separated tags
- `status` - Contact status (subscribed, unsubscribed, bounced, complained)
- Any other columns will be stored as custom fields

### Example CSV

```csv
email,firstName,lastName,tags,company,phone
john@example.com,John,Doe,"customer,vip",Acme Inc,+1234567890
jane@example.com,Jane,Smith,newsletter,Tech Corp,+0987654321
bob@example.com,Bob,Johnson,"customer,premium",StartupXYZ,+1122334455
```

---

## API Endpoints

### 1. Validate CSV (Preview)

Validate CSV file before importing to check for errors.

```http
POST /api/contacts/:workspaceId/validate-csv
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: contacts.csv
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Row 5: Duplicate email: john@example.com",
    "Row 8: Invalid email format: invalid-email"
  ],
  "preview": [
    {
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tags": "customer,vip"
    },
    {
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "tags": "newsletter"
    }
  ]
}
```

---

### 2. Import CSV

Import contacts from CSV file.

```http
POST /api/contacts/:workspaceId/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: contacts.csv
audienceId: audience-uuid (optional)
updateExisting: true (optional, default: false)
```

**Response:**
```json
{
  "total": 100,
  "imported": 85,
  "updated": 10,
  "skipped": 3,
  "failed": 2,
  "errors": [
    {
      "row": 15,
      "email": "invalid-email",
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "row": 42,
      "email": "test@",
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "warnings": [
    "Row 8: Contact john@example.com already exists",
    "Row 23: Duplicate email jane@example.com in CSV"
  ],
  "contacts": [
    {
      "id": "contact-uuid-1",
      "email": "john@example.com",
      "status": "imported"
    },
    {
      "id": "contact-uuid-2",
      "email": "jane@example.com",
      "status": "updated"
    }
  ]
}
```

---

## Validation Rules

### Email Validation
- **Required**: Email field must be present
- **Format**: Must match standard email format (user@domain.com)
- **Length**: Maximum 255 characters
- **Normalization**: Automatically converted to lowercase and trimmed
- **Duplicates**: Checked against existing contacts and within CSV

### Name Validation
- **Optional**: First name and last name are optional
- **Length**: Maximum 50 characters each
- **Sanitization**: Trimmed and cleaned

### Tags Validation
- **Format**: Comma, semicolon, or pipe separated
- **Length**: Maximum 50 characters per tag
- **Limit**: Maximum 10 tags per contact
- **Duplicates**: Automatically removed

### Status Validation
- **Values**: subscribed, unsubscribed, bounced, complained
- **Default**: If not provided or invalid, defaults to "subscribed"
- **Case-insensitive**: Automatically normalized

### Custom Fields
- **Automatic**: Any non-standard column becomes a custom field
- **Key length**: Maximum 50 characters
- **Value length**: Maximum 500 characters
- **Sanitization**: Trimmed and cleaned

---

## Import Options

### Update Existing Contacts

When `updateExisting: true`:
- Updates existing contacts with new data
- Merges tags (doesn't replace)
- Merges custom fields (doesn't replace)
- Adds to audience if specified

When `updateExisting: false` (default):
- Skips existing contacts
- Only imports new contacts
- Adds warning for each skipped contact

### Audience Assignment

If `audienceId` is provided:
- All imported contacts are added to the audience
- Existing contacts are also added if `updateExisting: true`
- Validates audience exists in workspace

---

## Error Handling

### File Validation Errors
```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit"
}
```

```json
{
  "statusCode": 400,
  "message": "CSV file exceeds maximum of 10000 rows"
}
```

```json
{
  "statusCode": 400,
  "message": "CSV must contain an 'email' column"
}
```

### Row-Level Errors
Each error includes:
- `row`: Row number in CSV (including header)
- `email`: Email address (or "N/A" if missing)
- `field`: Field that caused the error
- `message`: Detailed error message

### Common Row Errors
- "Email is required"
- "Invalid email format"
- "Duplicate email in CSV"
- Database constraint violations

---

## Best Practices

### 1. Validate Before Importing
Always use the validate endpoint first to check for errors:

```bash
# Step 1: Validate
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/validate-csv \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv"

# Step 2: Review errors and warnings

# Step 3: Import
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/import \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv" \
  -F "updateExisting=false"
```

### 2. Clean Your Data
- Remove duplicate emails before uploading
- Validate email formats
- Use consistent column names
- Remove empty rows

### 3. Use Proper Encoding
- Save CSV as UTF-8
- Avoid special characters in column names
- Use quotes for fields with commas

### 4. Test with Small Batches
- Start with 10-50 contacts
- Verify import results
- Then import full dataset

### 5. Handle Large Files
For files > 10,000 rows:
- Split into multiple files
- Import in batches
- Monitor import results

---

## Example Workflows

### Workflow 1: Simple Import

```bash
# Upload CSV with basic fields
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/import \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv"
```

### Workflow 2: Import to Audience

```bash
# Import and add to specific audience
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/import \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv" \
  -F "audienceId=AUDIENCE_ID"
```

### Workflow 3: Update Existing

```bash
# Import and update existing contacts
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/import \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv" \
  -F "updateExisting=true"
```

### Workflow 4: Validate First

```bash
# Step 1: Validate
VALIDATION=$(curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/validate-csv \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@contacts.csv")

echo $VALIDATION | jq '.valid'

# Step 2: If valid, import
if [ $(echo $VALIDATION | jq '.valid') == "true" ]; then
  curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/import \
    -H "Authorization: Bearer TOKEN" \
    -F "file=@contacts.csv"
fi
```

---

## CSV Templates

### Basic Template
```csv
email,firstName,lastName
john@example.com,John,Doe
jane@example.com,Jane,Smith
```

### With Tags
```csv
email,firstName,lastName,tags
john@example.com,John,Doe,"customer,vip"
jane@example.com,Jane,Smith,newsletter
```

### With Custom Fields
```csv
email,firstName,lastName,company,phone,country
john@example.com,John,Doe,Acme Inc,+1234567890,USA
jane@example.com,Jane,Smith,Tech Corp,+0987654321,UK
```

### With Status
```csv
email,firstName,lastName,status,tags
john@example.com,John,Doe,subscribed,"customer,vip"
jane@example.com,Jane,Smith,unsubscribed,newsletter
```

---

## Limits and Constraints

| Limit | Value |
|-------|-------|
| Max file size | 5 MB |
| Max rows | 10,000 |
| Max email length | 255 characters |
| Max name length | 50 characters |
| Max tags per contact | 10 |
| Max tag length | 50 characters |
| Max custom field key | 50 characters |
| Max custom field value | 500 characters |

---

## Troubleshooting

### Issue: "CSV parsing error"
**Solution**: Check CSV format, ensure proper encoding (UTF-8), remove special characters

### Issue: "File size exceeds limit"
**Solution**: Split file into smaller batches, remove unnecessary columns

### Issue: "Invalid email format"
**Solution**: Validate emails before upload, use proper email format

### Issue: "Duplicate emails"
**Solution**: Remove duplicates from CSV, or use `updateExisting: true`

### Issue: "Column not found"
**Solution**: Ensure CSV has "email" column (case-insensitive)

### Issue: "Too many rows"
**Solution**: Split CSV into files with < 10,000 rows each

---

## Performance Tips

1. **Batch Processing**: Import runs asynchronously for large files
2. **Validation**: Pre-validate to catch errors early
3. **Duplicates**: Remove duplicates before upload for faster processing
4. **Columns**: Only include necessary columns
5. **Encoding**: Use UTF-8 encoding for best compatibility

---

## Security

- ✅ Workspace isolation enforced
- ✅ User authentication required
- ✅ File size limits prevent abuse
- ✅ Row limits prevent memory issues
- ✅ Input sanitization on all fields
- ✅ SQL injection prevention
- ✅ XSS prevention on custom fields

---

## Summary

The CSV import feature provides:
- ✅ Comprehensive validation
- ✅ Detailed error reporting
- ✅ Duplicate detection
- ✅ Flexible data mapping
- ✅ Update existing contacts
- ✅ Audience assignment
- ✅ Custom fields support
- ✅ Production-ready error handling

Perfect for bulk contact imports with confidence!
