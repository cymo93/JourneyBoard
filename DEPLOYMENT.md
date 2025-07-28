# JourneyBoard Deployment Guide

## Option 1: Vercel (Recommended - Free & Easy)

### Step 1: Prepare Your Code
1. **Ensure all changes are committed** to your Git repository
2. **Test locally** with `npm run build` to ensure no build errors
3. **Update your `.env.local`** with production Firebase config

### Step 2: Deploy to Vercel
1. **Go to [Vercel](https://vercel.com)** and sign up/login with GitHub
2. **Click "New Project"**
3. **Import your GitHub repository** (JourneyBoard)
4. **Configure project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all variables from your `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     PEXELS_API_KEY=your_pexels_key
     ```
6. **Click "Deploy"**

### Step 3: Configure Firebase for Production
1. **Go to Firebase Console** → Authentication → Settings
2. **Add your Vercel domain** to "Authorized domains":
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if you add one)
3. **Update Firestore Rules** (if needed for production)

### Step 4: Custom Domain (Optional)
1. **In Vercel dashboard**, go to your project
2. **Click "Settings"** → "Domains"
3. **Add your custom domain** (e.g., `journeyboard.com`)
4. **Update DNS records** as instructed
5. **Add the domain to Firebase** authorized domains

---

## Option 2: Netlify (Alternative - Free)

### Step 1: Deploy to Netlify
1. **Go to [Netlify](https://netlify.com)** and sign up
2. **Click "New site from Git"**
3. **Connect your GitHub repository**
4. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. **Add environment variables** (same as Vercel)
6. **Click "Deploy site"**

---

## Option 3: Firebase Hosting (Advanced)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Initialize Firebase
```bash
firebase login
firebase init hosting
```

### Step 3: Configure Firebase
1. **Select your project:** `journeyboard-deploy1`
2. **Public directory:** `out`
3. **Configure as single-page app:** `Yes`
4. **Set up automatic builds:** `No`

### Step 4: Update next.config.ts
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### Step 5: Build and Deploy
```bash
npm run build
firebase deploy
```

---

## Environment Variables for Production

### Required Variables:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=journeyboard-deploy1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=journeyboard-deploy1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=journeyboard-deploy1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=186357342994
NEXT_PUBLIC_FIREBASE_APP_ID=1:186357342994:web:4570098e4b34673dd789cb

# Pexels API
PEXELS_API_KEY=your_pexels_api_key
```

### Optional Variables:
```env
# Analytics (if you add them later)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

---

## Post-Deployment Checklist

### ✅ Technical Setup
- [ ] Build completes successfully
- [ ] Environment variables are set
- [ ] Firebase domain is authorized
- [ ] Firestore rules are updated
- [ ] Indexes are created

### ✅ Functionality Testing
- [ ] User registration/login works
- [ ] Trip creation works
- [ ] Trip sharing works
- [ ] Real-time collaboration works
- [ ] Image generation works

### ✅ Performance
- [ ] Page load times are acceptable
- [ ] Images load properly
- [ ] Mobile responsiveness works
- [ ] No console errors

### ✅ Security
- [ ] HTTPS is enabled
- [ ] Firebase security rules are enforced
- [ ] API keys are not exposed
- [ ] Authentication works properly

---

## Monitoring & Analytics

### Vercel Analytics (Free)
1. **Enable Vercel Analytics** in your project settings
2. **Track page views, performance, and errors**

### Firebase Analytics (Free)
1. **Enable Firebase Analytics** in your Firebase project
2. **Track user engagement and app usage**

### Custom Monitoring
Consider adding:
- **Error tracking:** Sentry, LogRocket
- **Performance monitoring:** Web Vitals, Lighthouse
- **User analytics:** Mixpanel, Amplitude

---

## Scaling Considerations

### Free Tier Limits:
- **Vercel:** 100GB bandwidth/month, 100 serverless function executions/day
- **Firebase:** 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day
- **Pexels:** 5,000 requests/hour

### When to Upgrade:
- **More than 100 active users**
- **High image generation usage**
- **Complex trip sharing features**
- **Real-time collaboration at scale**

### Upgrade Path:
1. **Vercel Pro:** $20/month (unlimited bandwidth, more functions)
2. **Firebase Blaze:** Pay-as-you-go (scales automatically)
3. **Custom domain:** $12-15/year
4. **CDN:** Cloudflare (free) or Vercel Edge Network 