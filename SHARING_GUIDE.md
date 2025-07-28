# JourneyBoard Sharing System Guide

## 🎯 How Sharing Currently Works

### **Current Implementation:**
- ✅ **Invitations are stored** in Firestore
- ✅ **Users see pending invitations** when they log in
- ✅ **Users can accept/decline** invitations
- ✅ **Collaborative editing** works for accepted trips
- ❌ **Email notifications** are not sent yet

### **What Happens When You Share:**

1. **You click "Share Trip"** and enter an email
2. **Invitation is stored** in the database
3. **Your friend logs in** to JourneyBoard
4. **They see the invitation** at the top of their trips page
5. **They click "Accept"** to join the trip
6. **They can now view/edit** the trip based on permissions

---

## 🔄 Sharing Workflow

### **For Trip Owners:**
1. Go to any trip (your trips page or trip detail page)
2. Click the **Share** button (📤 icon)
3. Enter the **email address** of your friend
4. Choose **permission level**:
   - **Editor**: Can view and edit the trip
   - **Viewer**: Can only view the trip
5. Click **"Share Trip"**
6. Your friend will see the invitation when they log in

### **For Invited Users:**
1. **Log in** to JourneyBoard
2. **Look for the invitation card** at the top of your trips page
3. **Click "Accept"** to join the trip
4. **The trip appears** in your trips list
5. **Start collaborating!** 🎉

---

## 🎨 Permission Levels

### **Owner** (Original Creator)
- ✅ Create and delete trips
- ✅ Edit all trip details
- ✅ Share with others
- ✅ Remove access for others

### **Editor**
- ✅ View the trip
- ✅ Edit trip details
- ✅ Add/remove locations
- ✅ Edit activities
- ❌ Cannot delete the trip
- ❌ Cannot share with others

### **Viewer**
- ✅ View the trip
- ✅ View all details
- ❌ Cannot edit anything
- ❌ Cannot share with others

---

## 🚀 Future Enhancements

### **Coming Soon:**
- 📧 **Email notifications** when invited
- 🔔 **Real-time updates** when others edit
- 👥 **Multiple permission levels**
- 📱 **Mobile app notifications**

### **Current Limitations:**
- Users must **log in to see invitations**
- No **email notifications** yet
- No **real-time collaboration indicators**

---

## 🛠️ Technical Details

### **Database Collections:**
- `trips`: Trip data with `ownerId`, `editors`, `viewers` arrays
- `invitations`: Pending invitations with email and permissions

### **Security Rules:**
- Users can only access trips they own, edit, or view
- Invitations are accessible to authenticated users
- All operations require authentication

---

## ❓ Frequently Asked Questions

### **Q: Why doesn't my friend get an email?**
A: Email notifications are coming soon! For now, they need to log in to JourneyBoard to see the invitation.

### **Q: Can I share with someone who doesn't have an account?**
A: They'll need to create a JourneyBoard account first, then they'll see the invitation when they log in.

### **Q: Can I remove someone's access?**
A: Yes! Trip owners can remove editors/viewers (feature coming soon).

### **Q: What if I accidentally decline an invitation?**
A: The trip owner can share it again with you.

---

## 🎉 Ready to Share!

**The sharing system is fully functional!** Just remember:
1. **Share trips** using the share button
2. **Tell your friends** to log in to see invitations
3. **Start planning together!** 🗺️✈️ 