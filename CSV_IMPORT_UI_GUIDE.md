# CSV Import UI Guide

## Overview
User-friendly interface for importing contacts from CSV files with real-time validation and detailed feedback.

## Features

### 🎯 Step-by-Step Workflow
1. **Upload CSV** - Drag & drop or click to select
2. **Validate** - Check for errors before importing
3. **Review** - See preview and validation results
4. **Import** - Execute import with options
5. **Results** - View detailed import statistics

### ✨ Key Features
- ✅ File validation (size, format)
- ✅ CSV template download
- ✅ Real-time validation preview
- ✅ Error and warning display
- ✅ Data preview (first 5 rows)
- ✅ Update existing contacts option
- ✅ Detailed import statistics
- ✅ Error tracking per row

---

## User Flow

### Step 1: Access Import Page

From Contacts page, click **"📥 Import CSV"** button

**URL:** `/workspace/:id/contacts/import`

### Step 2: Download Template (Optional)

Click **"📥 Download CSV Template"** to get a sample CSV file with proper format:

```csv
email,firstName,lastName,tags,company,phone
john@example.com,John,Doe,"customer,vip",Acme Inc,+1234567890
jane@example.com,Jane,Smith,newsletter,Tech Corp,+0987654321
```

### Step 3: Upload CSV File

**Two ways to upload:**
1. Click the upload area
2. Drag and drop file

**Validation on upload:**
- File must be .csv format
- Maximum size: 5MB
- Shows file name and size

**Options:**
- ☐ Update existing contacts (merge data instead of skipping)

### Step 4: Validate CSV

Click **"Validate CSV"** button

**Validation checks:**
- File size and format
- Required columns (email)
- Email format validation
- Duplicate detection
- Row count limits

**Validation Results:**

✅ **Success:**
```
✓ CSV is valid and ready to import!
```

❌ **Errors:**
```
✗ CSV has errors that must be fixed
• CSV must contain an "email" column
• File size exceeds 5MB limit
```

⚠️ **Warnings:**
```
⚠ Warnings:
• Row 5: Duplicate email: john@example.com
• Row 8: Invalid email format: invalid-email
• Row 12: Contact jane@example.com already exists
```

**Preview Table:**
Shows first 5 rows with columns:
- Email
- First Name
- Last Name
- Tags

### Step 5: Import Contacts

If validation passes, click **"Import Contacts"** button

**Progress:**
- Shows "Importing..." during process
- Cannot cancel once started

### Step 6: View Results

**Statistics Dashboard:**
```
┌─────────┬──────────┬─────────┬─────────┬────────┐
│  Total  │ Imported │ Updated │ Skipped │ Failed │
├─────────┼──────────┼─────────┼─────────┼────────┤
│   100   │    85    │   10    │    3    │   2    │
└─────────┴──────────┴─────────┴─────────┴────────┘
```

**Detailed Errors:**
```
Errors:
Row 15: invalid-email - Invalid email format
Row 42: test@ - Invalid email format
```

**Warnings:**
```
Warnings:
• Row 8: Contact john@example.com already exists
• Row 23: Duplicate email jane@example.com in CSV
```

**Actions:**
- **View Contacts** - Go to contacts list
- **Import Another File** - Start over

---

## UI Components

### Upload Area
```
┌─────────────────────────────────────┐
│                                     │
│              ☁️ Upload              │
│                                     │
│     Click to upload CSV file        │
│  Maximum file size: 5MB | Max rows: 10,000  │
│                                     │
└─────────────────────────────────────┘
```

### File Selected
```
┌─────────────────────────────────────┐
│ ✓  contacts.csv                     │
│    125.45 KB                  Remove│
└─────────────────────────────────────┘

☐ Update existing contacts
```

### Validation Success
```
┌─────────────────────────────────────┐
│ ✓ CSV is valid and ready to import!│
└─────────────────────────────────────┘

Preview (first 5 rows):
┌──────────────────┬───────────┬──────────┬──────┐
│ Email            │ First Name│ Last Name│ Tags │
├──────────────────┼───────────┼──────────┼──────┤
│ john@example.com │ John      │ Doe      │ vip  │
└──────────────────┴───────────┴──────────┴──────┘

[Cancel]  [Import Contacts]
```

### Validation Errors
```
┌─────────────────────────────────────┐
│ ✗ CSV has errors that must be fixed│
└─────────────────────────────────────┘

Errors:
• CSV must contain an "email" column
• File size exceeds 5MB limit

[Cancel]
```

### Import Results
```
┌─────────────────────────────────────┐
│        Import Complete! 🎉          │
└─────────────────────────────────────┘

┌───────┬─────────┬─────────┬─────────┬────────┐
│ Total │Imported │ Updated │ Skipped │ Failed │
├───────┼─────────┼─────────┼─────────┼────────┤
│  100  │   85    │   10    │    3    │   2    │
└───────┴─────────┴─────────┴─────────┴────────┘

[View Contacts]  [Import Another File]
```

---

## Color Coding

### Status Colors
- **Green** - Success, Imported
- **Blue** - Updated
- **Yellow** - Warnings, Skipped
- **Red** - Errors, Failed
- **Gray** - Total, Neutral

### Visual Indicators
- ✓ Success checkmark (green)
- ✗ Error cross (red)
- ⚠ Warning triangle (yellow)
- 📥 Download/Upload icon (blue)
- 🎉 Celebration (success)

---

## Error Messages

### File Upload Errors
```
❌ File size exceeds 5MB limit
❌ Please select a CSV file
```

### Validation Errors
```
❌ CSV parsing error: Invalid format
❌ CSV file is empty
❌ CSV must contain an "email" column
❌ CSV file exceeds maximum of 10000 rows
```

### Import Errors
```
❌ Import failed
❌ Validation failed
❌ Network error
```

---

## Best Practices for Users

### 1. Prepare Your CSV
- Use the template as a starting point
- Ensure email column exists
- Remove duplicate emails
- Validate email formats
- Keep file under 5MB

### 2. Validate First
- Always validate before importing
- Review all warnings
- Fix errors in CSV
- Check preview data

### 3. Choose Options Wisely
- **Update existing**: Use when you want to merge data
- **Skip existing**: Use for new contacts only

### 4. Review Results
- Check import statistics
- Review failed rows
- Fix errors and re-import if needed

---

## Keyboard Shortcuts

- **Ctrl/Cmd + Click** on upload area - Open file dialog
- **Esc** - Close modals/cancel
- **Enter** - Submit forms

---

## Mobile Responsiveness

### Desktop (> 768px)
- Full width layout
- 5-column statistics grid
- Side-by-side buttons

### Tablet (768px - 1024px)
- Adjusted padding
- 3-column statistics grid
- Stacked buttons

### Mobile (< 768px)
- Single column layout
- 2-column statistics grid
- Full-width buttons
- Scrollable tables

---

## Accessibility

### Screen Reader Support
- Proper ARIA labels
- Semantic HTML
- Status announcements
- Error descriptions

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals
- Focus indicators visible

### Visual Accessibility
- High contrast colors
- Clear error messages
- Icon + text labels
- Readable font sizes

---

## Tips & Tricks

### 💡 Quick Import
1. Download template
2. Fill with your data
3. Upload and validate
4. Import immediately

### 💡 Handling Large Files
- Split into multiple files
- Import in batches
- Monitor each import result

### 💡 Updating Contacts
- Enable "Update existing"
- Use same email addresses
- New data will merge with existing

### 💡 Troubleshooting
- Check file encoding (UTF-8)
- Remove special characters
- Validate emails externally
- Check column names

---

## Example Workflows

### Workflow 1: First Time Import
```
1. Click "Import CSV"
2. Download template
3. Fill with contacts
4. Upload file
5. Validate
6. Review preview
7. Import
8. View contacts
```

### Workflow 2: Update Existing
```
1. Export current contacts
2. Modify CSV
3. Upload file
4. Enable "Update existing"
5. Validate
6. Import
7. Check updated count
```

### Workflow 3: Fix Errors
```
1. Upload file
2. Validate
3. See errors
4. Fix CSV file
5. Upload again
6. Validate again
7. Import
```

---

## Technical Details

### File Handling
- Client-side file reading
- FormData for upload
- Multipart/form-data encoding
- Progress indication

### API Calls
- POST `/api/contacts/:workspaceId/validate-csv`
- POST `/api/contacts/:workspaceId/import`
- Axios with interceptors
- Error handling

### State Management
- React useState hooks
- File state
- Validation state
- Import result state
- Loading states

---

## Summary

The CSV Import UI provides:
- ✅ Intuitive step-by-step process
- ✅ Real-time validation feedback
- ✅ Detailed error reporting
- ✅ Data preview before import
- ✅ Comprehensive import statistics
- ✅ User-friendly error messages
- ✅ Mobile responsive design
- ✅ Accessible interface

Perfect for bulk contact imports with confidence and control!
