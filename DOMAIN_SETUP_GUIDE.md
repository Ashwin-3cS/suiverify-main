# 🌐 SuiVerify Single Domain Setup Guide

## 🎯 **Target Architecture**
```
suiverify.xyz                    → Landing Page (Root)
suiverify.xyz/auth              → Authentication Page
suiverify.xyz/dashboard         → Main Dashboard
suiverify.xyz/kyc               → KYC Process
suiverify.xyz/admin             → Admin Panel
suiverify.xyz/adminLogin        → Admin Login
```

**All routes on the same domain with landing page as the homepage!**

---

## 🏗️ **Implementation Strategy**

### **Option 1: Vercel Rewrites (Recommended)**
Use Vercel's rewrite functionality to route different paths to different deployments.

### **Option 2: Monorepo Approach**
Combine both projects into a single deployment.

**We'll use Option 1 as it's cleaner and maintains separation.**

---

## 📋 **Step-by-Step Setup Process**

### **Step 1: Configure Landing Page as Primary**

1. **Set Landing Page as Main Domain**
   - Go to Vercel Dashboard
   - Select your `suiverify-landing` project
   - Go to **Settings** → **Domains**
   - Add: `suiverify.xyz`
   - This will be your primary domain

2. **Configure DNS Records**
   ```
   Type: A
   Name: @
   Value: 76.76.19.61 (Vercel's IP)
   
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   ```

### **Step 2: Add Vercel Rewrites to Landing Page**

Create `/home/ash-win/projects/suiverify-landing/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/auth",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/auth"
    },
    {
      "source": "/dashboard",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/dashboard"
    },
    {
      "source": "/kyc",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/kyc"
    },
    {
      "source": "/admin",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/admin"
    },
    {
      "source": "/adminLogin",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/adminLogin"
    },
    {
      "source": "/api/(.*)",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/api/$1"
    }
  ]
}
```

### **Step 3: Update Landing Page Code**

#### **Update HeroSection.tsx**
In `/home/ash-win/projects/suiverify-landing/src/components/sections/HeroSection.tsx`:

```typescript
const handleAccessClick = () => {
  // Route to auth page on same domain
  window.location.href = '/auth';
};
```

### **Step 4: Update Main App References**

#### **Update Auth Page**
In `/home/ash-win/projects/suiverify-main/app/auth/page.tsx`:

```typescript
// Update the footer link
Don&apos;t have access? <a href="/" className="underline" style={{ color: '#4DA2FF' }}>Request access</a>
```

#### **Update Protected Route**
In `/home/ash-win/projects/suiverify-main/components/ProtectedRoute.tsx`:

```typescript
// Update redirect logic if needed
if (!authData) {
  // Redirect to auth page on same domain
  router.push('/auth');
  return;
}
```

### **Step 5: Update Environment Variables**

#### **Landing Page (.env)**
```env
NEXT_PUBLIC_APP_URL=https://suiverify.xyz
NEXT_PUBLIC_API_URL=https://suiverify.xyz/api
```

#### **Main App (.env)**
```env
NEXT_PUBLIC_APP_URL=https://suiverify.xyz
NEXT_PUBLIC_LANDING_URL=https://suiverify.xyz
```

### **Step 6: Update Metadata and SEO**

#### **Main App Layout.tsx**
```typescript
export const metadata: Metadata = {
  // ... other metadata
  openGraph: {
    url: "https://suiverify.xyz/",
    // ... other openGraph settings
    images: [
      {
        url: "https://suiverify.xyz/logoo.png",
        // ... other image settings
      },
    ],
  },
  twitter: {
    // ... other twitter settings
    images: ["https://suiverify.xyz/logoo.png"],
  },
};
```

---

## 🔧 **Implementation Files**

### **Create vercel.json for Landing Page**

You need to create this file in your landing page project:

```bash
cd /home/ash-win/projects/suiverify-landing
```

Create `vercel.json` with the rewrite rules shown above.

---

## ✅ **Verification Steps**

### **Step 1: Test URLs After Setup**
- ✅ `https://suiverify.xyz` → Should show landing page
- ✅ `https://suiverify.xyz/auth` → Should show login page (from main app)
- ✅ `https://suiverify.xyz/dashboard` → Should redirect to auth if not logged in
- ✅ `https://suiverify.xyz/kyc` → Should work when logged in

### **Step 2: Test User Flow**
1. Visit `https://suiverify.xyz` → See landing page
2. Click "Request Access" → Waitlist dialog opens
3. Click "I Have Access" → Goes to `https://suiverify.xyz/auth`
4. Login with `admin` / `SuiVerify2024!` → Redirects to `https://suiverify.xyz/dashboard`
5. Access `https://suiverify.xyz/kyc` → Works when authenticated

### **Step 3: Test API Routes**
- ✅ `https://suiverify.xyz/api/*` → Should proxy to main app APIs

---

## 🚀 **Deployment Commands**

### **Step 1: Update Landing Page**
```bash
cd /home/ash-win/projects/suiverify-landing

# Create vercel.json file
cat > vercel.json << 'EOF'
{
  "rewrites": [
    {
      "source": "/auth",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/auth"
    },
    {
      "source": "/dashboard",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/dashboard"
    },
    {
      "source": "/kyc",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/kyc"
    },
    {
      "source": "/admin",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/admin"
    },
    {
      "source": "/adminLogin",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/adminLogin"
    },
    {
      "source": "/api/(.*)",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/api/$1"
    }
  ]
}
EOF

# Update HeroSection.tsx routing
# (Update the handleAccessClick function as shown above)

git add .
git commit -m "feat: add vercel rewrites for single domain architecture"
git push origin main
```

### **Step 2: Update Main App**
```bash
cd /home/ash-win/projects/suiverify-main

# Update auth page footer link
# Update any other references to use relative paths

git add .
git commit -m "feat: update references for single domain setup"
git push origin main
```

---

## 🎯 **Final Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    suiverify.xyz                            │
│                   (Landing Page)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Landing Page                               ││
│  │                                                         ││
│  │  [Request Access]  [I Have Access]                     ││
│  │        │                    │                          ││
│  │   Email Dialog         Routes to /auth                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Vercel Rewrites)
┌─────────────────────────────────────────────────────────────┐
│              Main App Routes (Proxied)                      │
│                                                             │
│  /auth      /dashboard    /kyc       /admin                │
│  ┌─────┐    ┌─────────┐   ┌─────┐    ┌─────┐               │
│  │Login│    │Main Hub │   │ KYC │    │Admin│               │
│  │Page │    │         │   │     │    │Panel│               │
│  └─────┘    └─────────┘   └─────┘    └─────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 **Security & Performance Notes**

### **Benefits of This Approach:**
- ✅ **Single Domain**: Clean user experience
- ✅ **SEO Friendly**: All content under one domain
- ✅ **Easy SSL**: One certificate for everything
- ✅ **Separation**: Projects remain separate for development

### **Considerations:**
- 🔄 **Latency**: Slight additional latency for proxied routes
- 📊 **Analytics**: May need to configure for cross-deployment tracking
- 🔧 **Debugging**: Need to check both deployments for issues

---

## 🎉 **Ready to Deploy!**

After following these steps:

1. **Landing page** serves the root domain
2. **Main app routes** are accessible via rewrites
3. **Single domain experience** for users
4. **Clean architecture** maintained

Your users will experience:
- `suiverify.xyz` → Beautiful landing page
- `suiverify.xyz/auth` → Seamless login
- `suiverify.xyz/dashboard` → Main application

**Perfect single-domain setup achieved!** 🚀

---

## 🔧 **What to Do with suiverify-main Domain Settings**

### **Option 1: Keep Current Vercel URL (Recommended)**

**Keep the main app on its current Vercel URL:**
- `https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/`

**Why this is recommended:**
- ✅ **No changes needed** - Just works with rewrites
- ✅ **Backup access** - You can still access main app directly if needed
- ✅ **Development** - Easy to test main app independently
- ✅ **Debugging** - Can isolate issues to specific deployments

**Domain Settings for suiverify-main:**
- **Keep existing**: `suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app`
- **Don't add**: `suiverify.xyz` (this goes to landing page)
- **Optional**: Add a subdomain like `app-direct.suiverify.xyz` for direct access

### **Option 2: Add a Subdomain for Direct Access**

If you want direct access to the main app:

**Add to suiverify-main domains:**
- `app-direct.suiverify.xyz` or `main.suiverify.xyz`

**DNS Record:**
```
Type: CNAME
Name: app-direct
Value: cname.vercel-dns.com
```

**Benefits:**
- Direct access to main app: `https://app-direct.suiverify.xyz`
- Useful for development and testing
- Backup if rewrites have issues

### **Option 3: Remove Custom Domains (Clean Approach)**

**For suiverify-main project:**
- **Remove any custom domains** if you added them
- **Keep only**: The default Vercel URL
- **Result**: Main app only accessible via rewrites from landing page

---

## 📋 **Recommended Configuration**

### **suiverify-landing Project Domains:**
```
✅ suiverify.xyz (Primary)
✅ www.suiverify.xyz (Redirect to primary)
```

### **suiverify-main Project Domains:**
```
✅ suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app (Keep default)
🔧 Optional: app-direct.suiverify.xyz (For direct access)
❌ Don't add: suiverify.xyz (This belongs to landing page)
```

---

## 🎯 **Step-by-Step Domain Configuration**

### **Step 1: Configure Landing Page (Primary)**
1. Go to Vercel Dashboard
2. Select `suiverify-landing` project
3. Go to **Settings** → **Domains**
4. Add: `suiverify.xyz`
5. Add: `www.suiverify.xyz` (optional, redirects to main)

### **Step 2: Configure Main App (Secondary)**
1. Go to Vercel Dashboard  
2. Select `suiverify-main` project
3. Go to **Settings** → **Domains**
4. **Keep existing**: `suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app`
5. **Optional**: Add `app-direct.suiverify.xyz` for direct access
6. **Important**: Do NOT add `suiverify.xyz` here

### **Step 3: Update vercel.json Rewrites**
Make sure your landing page `vercel.json` points to the correct URL:

```json
{
  "rewrites": [
    {
      "source": "/auth",
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/auth"
    },
    {
      "source": "/dashboard", 
      "destination": "https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/dashboard"
    }
    // ... other routes
  ]
}
```

---

## 🔍 **Testing Your Setup**

### **URLs That Should Work:**
- ✅ `https://suiverify.xyz` → Landing page
- ✅ `https://suiverify.xyz/auth` → Main app auth (via rewrite)
- ✅ `https://suiverify.xyz/dashboard` → Main app dashboard (via rewrite)
- ✅ `https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app/auth` → Direct access (backup)

### **URLs That Should NOT Work:**
- ❌ `https://suiverify-main-git-main-ashwins-projects-30bd381d.vercel.app` on main domain

---

## 💡 **Pro Tips**

### **For Development:**
- Use the direct Vercel URL to test main app changes
- Use `suiverify.xyz` to test the complete user flow

### **For Production:**
- Users only see `suiverify.xyz` URLs
- Main app URL remains hidden behind rewrites
- Clean, professional appearance

### **For Debugging:**
- Check both deployments if issues occur
- Vercel function logs will show in respective projects
- Network tab shows actual destination URLs

---

## 🚀 **Quick Action Items**

1. **Don't change** suiverify-main domain settings
2. **Add** `suiverify.xyz` to suiverify-landing project
3. **Create** `vercel.json` in landing page project
4. **Update** landing page code to use relative paths
5. **Test** the complete flow

**Your main app stays exactly where it is - the magic happens through Vercel rewrites!** ✨
