# Security Specification: Jahan Grments Firestore Rules

## 1. Data Invariants
1. **Admin Master Gate**: Only verified store admins (or primary owner `ibraheemtalat2014@gmail.com`) can create, update, or delete products, categories, store settings, banners, and coupons.
2. **Order Identity & Immutability**:
   - A customer can only create an order with their own authenticated `userId` (`request.auth.uid`).
   - Customers can read only their own orders (`resource.data.userId == request.auth.uid`).
   - Admins can read and list all orders.
   - Customers cannot modify order status, delivery charges, or prices once created.
   - Only admins can update order status (e.g., from 'pending' to 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').
3. **Inventory Decrement Integrity**:
   - Only authenticated checkout operations or admins can update product inventory variants.
   - Stock values must never be negative.
4. **PII Isolation**:
   - User profile documents (`/users/{userId}`) can only be read and updated by the respective user (`request.auth.uid == userId`) or an admin.
   - Users cannot grant themselves the admin role in `/users/{userId}` or `/admins/{userId}`.
5. **Review Authenticity**:
   - Reviews require an authenticated user whose `userId` matches the review's `userId`.
   - Moderation approval (`isApproved`) can only be updated by admins.
6. **Public Storefront Reads**:
   - Anyone (even unauthenticated visitors) can read active products, categories, active banners, approved reviews, and public store settings.

---

## 2. The "Dirty Dozen" Threat Payloads
The following 12 attack payloads must be mathematically blocked with `PERMISSION_DENIED`:

1. **Privilege Escalation**: Non-admin attempts to create a document in `/admins/{attackerUid}`.
2. **User Role Injection**: Normal customer attempts to update their own `/users/{uid}` with `role: "owner"` or `role: "admin"`.
3. **Order Impersonation**: Attacker attempts to create an order in `/orders/{orderId}` with `userId: "victim_user_123"`.
4. **Order State Tampering**: Customer attempts to update `/orders/{orderId}` to change status from `pending` to `delivered` or change `grandTotal` to `0`.
5. **Unauthenticated Catalog Write**: Unauthenticated visitor attempts to delete or overwrite `/products/{productId}`.
6. **Negative Stock Injection**: Attacker attempts to update product variant stock to `-10`.
7. **Cross-Customer Order Snooping**: Authenticated user A queries or reads `/orders/{orderId}` belonging to user B.
8. **Customer Profile Scraping**: Authenticated user attempts to list or read another user's document in `/users/{otherUid}`.
9. **Settings Hijacking**: Normal user attempts to update `/settings/store` to redirect WhatsApp or set delivery charges to 0.
10. **Coupon Tampering**: Normal user attempts to create a 100% discount coupon in `/coupons/{couponId}`.
11. **Review Forgery**: Attacker submits a review with `isApproved: true` or with another user's `userId`.
12. **Banner Defacement**: Non-admin attempts to replace homepage hero banner with malicious URL.
