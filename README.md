# Halo SQL Explorer

A local-first SQL query tool for Halo PSA that connects via OAuth and allows you to explore your data with SQL queries.

## Features

-   🔐 **Secure OAuth Authentication** - Connect to your Halo instance securely
-   🗄️ **Database Explorer** - Browse tables and columns with search functionality
-   📝 **SQL Query Editor** - Write and execute SQL queries with syntax highlighting
-   📊 **Results Grid** - View query results in a clean, sortable table format
-   🔍 **Global Search** - Use Ctrl+F to quickly find tables and columns
-   💾 **Local Storage** - Refresh tokens are stored locally for persistent sessions
-   ⚙️ **Configurable** - Set your own authorization server, resource server, and tenant

## Setup Instructions

### 1. Create OAuth Application in Halo

1. Log into your Halo PSA instance
2. Go to **Config > Integrations > Halo API**
3. Note your **Authentication Server URL** (e.g., `https://mymsp.gocovi.com/auth`)
4. Create a new OAuth application with:
    - **Redirect URI**: `http://localhost:5173/auth/callback` (for development)
    - **Scopes**: `read:reporting edit:reporting offline_access`
    - **Grant Types**: Authorization Code

### 2. Configure the Application

1. Start the application
2. Click **Configure** to open the settings dialog
3. Enter your Halo configuration:
    - **Auth Server**: Your authentication server URL (e.g., `https://mymsp.gocovi.com/auth`)
    - **Resource Server**: Your base server URL (e.g., `https://mymsp.gocovi.com`)
    - **Client ID**: The OAuth client ID from step 1
    - **Redirect URI**: Automatically set to your current URL + `/auth/callback`

### 3. Connect and Use

1. Click **Connect to Halo** to start the OAuth flow
2. You'll be redirected to Halo to authorize the application
3. After authorization, you'll be redirected back and can start exploring

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

-   **OAuth Flow**: Uses PKCE (Proof Key for Code Exchange) for secure authentication
-   **Token Management**: Automatically handles access token refresh
-   **API Integration**: Connects to Halo's Report API for SQL execution
-   **Local Storage**: Securely stores refresh tokens in localStorage

## Security Features

-   PKCE implementation for OAuth 2.0 security
-   Automatic token refresh with 5-minute buffer
-   Secure storage of authentication tokens in localStorage
-   Persistent sessions - tokens are automatically refreshed and reused
-   No sensitive data logged or transmitted unnecessarily

## Usage

### Browsing Tables

-   Tables are automatically loaded when you connect
-   Click on a table to expand and see its columns
-   Use the search bar to find specific tables or columns
-   Press Ctrl+F to quickly focus the search

### Running Queries

-   Use the Console tab for ad-hoc queries
-   Create new query tabs for complex queries
-   Results are displayed in a sortable grid
-   Execution time is shown for performance monitoring

### Example Queries

```sql
-- Get recent tickets
SELECT
    t.faultid AS [Id],
    aareadesc AS [Company],
    USERS.uusername AS [User],
    t.symptom AS [Subject],
    rtdesc AS [Type],
    t.category2 AS [ServiceCategory]
FROM
    faults t
    JOIN tstatus ON tstatus = status
    JOIN requesttype ON rtid = requesttypenew
    JOIN AREA ON aarea = Areaint
    JOIN USERS ON Uid = t.userid
WHERE
    fdeleted = 0
    AND Aarea <> 1
    AND aarea <> 12
    AND (rtdesc = 'Incident' OR rtdesc = 'Service Request')
    AND dateoccured >= DATEADD(MONTH, -2, GETDATE())
    AND fhasbeenclosed = 1
```

## Troubleshooting

### Common Issues

1. **"No access token available"**

    - Check your OAuth configuration
    - Ensure your client ID is correct
    - Verify redirect URI matches exactly

2. **"Authentication failed"**

    - Check your authorization server URL
    - Verify tenant ID is correct
    - Ensure OAuth app is properly configured in Halo

3. **"API request failed"**
    - Check your resource server URL
    - Verify your OAuth app has the correct scopes
    - Check Halo API permissions

### Getting Help

-   Check the browser console for detailed error messages
-   Verify your Halo OAuth application configuration
-   Ensure all URLs are correct and accessible

## License

This project is open source and available under the MIT License.
