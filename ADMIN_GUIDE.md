# 👨‍💼 SuiVerify Admin Guide - User Management

## 🔐 Managing User Access

All user credentials are stored in `/access-control.json` in the main app repository.

### **Current Structure:**

```json
{
  "users": [
    {
      "username": "admin",
      "password": "SuiVerify2024!",
      "role": "admin"
    }
  ],
  "config": {
    "sessionTimeout": 3600000,
    "maxLoginAttempts": 3
  }
}
```

## 👥 Adding New Users

### **Step 1: Edit access-control.json**

When someone requests access and you approve them:

```json
{
  "users": [
    {
      "username": "admin",
      "password": "SuiVerify2024!",
      "role": "admin"
    },
    {
      "username": "john_doe",
      "password": "SecurePass123!",
      "role": "user"
    },
    {
      "username": "jane_smith",
      "password": "TestAccess456!",
      "role": "tester"
    }
  ],
  "config": {
    "sessionTimeout": 3600000,
    "maxLoginAttempts": 3
  }
}
```

### **Step 2: Commit & Deploy**

```bash
cd /home/ash-win/projects/suiverify-main
git add access-control.json
git commit -m "feat: add new approved users - john_doe, jane_smith"
git push origin main
```

### **Step 3: Email Credentials**

Send the user their credentials:

```
Subject: SuiVerify Access Approved - Your Credentials

Hi [Name],

Your application for SuiVerify access has been approved!

Your login credentials:
Username: john_doe
Password: SecurePass123!

To access the platform:
1. Visit https://suiverify.xyz
2. Click "I Have Access"
3. Enter your credentials
4. You'll be redirected to the dashboard

Welcome to SuiVerify!

Best regards,
SuiVerify Team
```

## 🎭 User Roles

### **Available Roles:**
- `admin` - Full access to all features including admin panel
- `user` - Standard user access to KYC and dashboard
- `tester` - Testing access with specific permissions
- `demo` - Limited demo access

### **Role Usage:**
```json
{
  "username": "new_user",
  "password": "SecurePassword123!",
  "role": "user"  // Choose: admin, user, tester, demo
}
```

## ⚙️ Configuration Options

### **Session Timeout:**
```json
"sessionTimeout": 3600000  // 1 hour in milliseconds
```

### **Login Attempts:**
```json
"maxLoginAttempts": 3  // Block after 3 failed attempts
```

## 🔒 Security Best Practices

### **Password Guidelines:**
- Use strong, unique passwords for each user
- Include uppercase, lowercase, numbers, and symbols
- Minimum 12 characters recommended

### **Username Guidelines:**
- Use lowercase with underscores: `john_doe`
- Avoid spaces or special characters
- Make them memorable but not guessable

### **Example Strong Passwords:**
- `SecurePass123!`
- `MyStr0ng_P@ssw0rd`
- `Sui_Verify_2024!`

## 🗑️ Removing Users

To remove a user, simply delete their entry from the JSON file:

```json
{
  "users": [
    {
      "username": "admin",
      "password": "SuiVerify2024!",
      "role": "admin"
    }
    // Removed john_doe entry
  ]
}
```

Then commit and deploy the changes.

## 📊 User Management Workflow

### **Daily Process:**
1. **Check emails** for new access requests
2. **Review applications** based on your criteria
3. **Add approved users** to `access-control.json`
4. **Deploy changes** to make credentials active
5. **Email users** their login information

### **Weekly Review:**
- Review active users and remove inactive ones
- Update passwords if needed
- Check for any security issues

## 🚨 Emergency Access

### **If you lose admin access:**
1. Edit `access-control.json` directly in the repository
2. Reset your admin password
3. Commit and deploy the changes
4. Use new credentials to log in

### **If someone's account is compromised:**
1. Immediately remove their entry from `access-control.json`
2. Deploy changes to revoke access
3. Generate new credentials if they need continued access

## 📈 Scaling Considerations

### **For larger user bases:**
- Consider moving to a database solution
- Implement automated user management
- Add email verification workflows
- Consider OAuth integration

### **Current approach is perfect for:**
- Small teams (5-50 users)
- Beta testing phases
- Controlled access scenarios
- Manual approval workflows

**Keep it simple until you need more complexity!** 🎯
