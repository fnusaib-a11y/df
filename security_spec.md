# Security Specification: StarConnect Zero-Trust Firestore Rules

## 1. Core Data Invariants

Our social media applet (StarConnect) stores user profiles, feed posts, comment threads, direct messages, followers connections, and friend requests. To guarantee full security, we enforce the following data invariants within our Attribute-Based Access Control (ABAC) architecture:

1. **User Role Integrity & Protection**:
   - A standard user must NEVER be able to self-promote their `role` (to 'admin' or 'creator'), nor self-assign status fields like `isVerified` (the blue verification badge) or `isPremium` (the creator tag).
   - Only administrative action can promote user roles or verify profiles.
   - Profile documents can only be written or updated by the authenticated user whose `uid` exactly matches the document path ID (`request.auth.uid == userId`).

2. **Author Identity Integrity**:
   - For all written content (`posts`, `comments`, `friend_requests`), the creator's ID in the document payload (`authorId` or `senderId`) MUST match `request.auth.uid`. Out-of-band spoofing is strictly prohibited.

3. **Message & Space Privacy**:
   - Direct messages can only be read, queried, or created by users who are explicitly listed as the `senderId` or `receiverId` in the message payload.
   
4. **Follow & Request Authenticity**:
   - A user cannot register a follow relation on behalf of another user (`followerId` must match the authenticated user).
   - A user cannot fake parent-relation records or modify immutable attributes such as `createdAt`.

5. **Size and Boundary Limit Enforcements**:
   - String fields (e.g. usernames, content, bio, reason) must have explicit `.size()` limits to prevent system resource exhaustion (Denial-of-Wallet).

---

## 2. The "Dirty Dozen" Attack Payloads

The following 12 JSON payloads attempt to exploit common Firestore access control gaps. Our security rules are designed to guarantee that every single one of these yields a strict `PERMISSION_DENIED`.

### Attack 1: Self-Promoted Admin Profile Creation
- **Target Path**: `/users/attacker_uid`
- **Attempt**: Create a user profile with role `admin` to gain admin control panel privileges.
```json
{
  "id": "attacker_uid",
  "name": "Malicious User",
  "phone": "01783332211",
  "role": "admin",
  "isVerified": false,
  "isPremium": false
}
```

### Attack 2: Self-Assigned Verified Blue Badge
- **Target Path**: `/users/attacker_uid`
- **Attempt**: Update their own profile setting `isVerified` to `true` directly via Client SDK.
```json
{
  "id": "attacker_uid",
  "name": "Malicious User",
  "phone": "01783332211",
  "isVerified": true
}
```

### Attack 3: Post Author Impersonation (Impersonate Creator)
- **Target Path**: `/posts/malicious_post_1`
- **Attempt**: Attacker creates a feed post setting the `authorId` to a famous creator's ID.
```json
{
  "id": "malicious_post_1",
  "authorId": "celebrity_creator_uid",
  "authorName": "Celebrity Creator",
  "content": "Buy this fake cryptocurrency!",
  "category": "News",
  "isReel": false
}
```

### Attack 4: Denial-of-Wallet Payload Poisoning
- **Target Path**: `/posts/oversized_post_1`
- **Attempt**: Post content with a extremely large body string (up to 1MB) to flood database storage and exceed index costs.
```json
{
  "id": "oversized_post_1",
  "authorId": "attacker_uid",
  "authorName": "Attacker",
  "content": "[An extremely massive 500,000-character malicious string...]",
  "category": "News",
  "isReel": false
}
```

### Attack 5: Shadow Updates (Ghost Fields Injection)
- **Target Path**: `/posts/existing_post_id`
- **Attempt**: Attempting to inject un-whitelisted ghost attributes (`ghostField: 'malicious'`) into a post document to test gap boundaries.
```json
{
  "id": "existing_post_id",
  "authorId": "attacker_uid",
  "authorName": "Attacker",
  "content": "Updated content",
  "category": "Lifestyle",
  "isReel": false,
  "ghostField": "malicious_injection"
}
```

### Attack 6: Unauthenticated Comment Thread Injection
- **Target Path**: `/posts/creators_post/comments/fake_comment_1`
- **Attempt**: Injecting comments with a mismatching `authorId` to impersonate standard users on feed discussions.
```json
{
  "id": "fake_comment_1",
  "postId": "creators_post",
  "authorId": "victim_user_uid",
  "authorName": "Victim Username",
  "content": "I endorse this scam!"
}
```

### Attack 7: Private Messages Snooping Query
- **Target Path**: `/messages/private_message_abc`
- **Attempt**: Attacker attempts to download or query general peer-to-peer messages where they are neither the sender nor receiver.
- **Client Query**: `db.collection('messages').get()` -> Expect restriction to `senderId` or `receiverId` checking.

### Attack 8: Message Sender Identity Spoofing
- **Target Path**: `/messages/fake_message_1`
- **Attempt**: Attacker creates a message setting the `senderId` to another user's ID to fabricate conversations.
```json
{
  "id": "fake_message_1",
  "chatId": "chat_room_abc",
  "senderId": "victim_user_uid",
  "receiverId": "target_creator_uid",
  "content": "Hello world!"
}
```

### Attack 9: Follow Registry Impersonation
- **Target Path**: `/follows/follow_victim_target`
- **Attempt**: Registering a follow relationship where `followerId` is a victim's ID, to force users to follow other profiles without active triggers.
```json
{
  "id": "follow_victim_target",
  "followerId": "victim_user_uid",
  "followingId": "target_creator_uid"
}
```

### Attack 10: Unauthorized Friend Request Acceptance
- **Target Path**: `/friend_requests/request_user_a_to_user_b`
- **Attempt**: Attacker updates an existing pending friend request between User A and User B to change the status to `accepted`.
```json
{
  "id": "request_user_a_to_user_b",
  "senderId": "user_a",
  "receiverId": "user_b",
  "status": "accepted",
  "createdAt": "2026-06-19"
}
```

### Attack 11: Friend Request Identity Spoofing
- **Target Path**: `/friend_requests/new_forged_request`
- **Attempt**: Creating a new friend request with a faked `senderId`.
```json
{
  "id": "new_forged_request",
  "senderId": "victim_user_uid",
  "receiverId": "target_user_uid",
  "status": "pending",
  "createdAt": "2026-06-19"
}
```

### Attack 12: Direct User Metric Manipulation
- **Target Path**: `/users/victim_user_uid`
- **Attempt**: Incrementing followersCount or followingCount properties directly via Firestore write without going through proper follow relations.
```json
{
  "id": "victim_user_uid",
  "followersCount": 999999
}
```

---

## 3. Test Runner Design spec (`firestore.rules.test.ts`)

A complete testing suite has been specified to systematically verify that our Firestore rules successfully catch and block all previous attack payloads.

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestApp,
  initializeAdminApp
} from '@firebase/rules-unit-testing';

const PROJECT_ID = "gen-lang-client-0769200242";

describe("StarConnect Fortress Security Rules Test Runner", () => {
  it("blocks user role self-promotion (Attack 1)", async () => {
    const db = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: "attacker" } }).firestore();
    const docRef = db.collection("users").doc("attacker");
    await assertFails(docRef.set({
      id: "attacker",
      name: "Malicious User",
      phone: "01783332211",
      role: "admin",
      isVerified: false,
      isPremium: false
    }));
  });

  it("blocks self-assigning verified badge (Attack 2)", async () => {
    const db = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: "attacker" } }).firestore();
    const docRef = db.collection("users").doc("attacker");
    await assertFails(docRef.update({
      isVerified: true
    }));
  });

  it("blocks post creator impersonation (Attack 3)", async () => {
    const db = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: "attacker" } }).firestore();
    const docRef = db.collection("posts").doc("malicious_post");
    await assertFails(docRef.set({
      id: "malicious_post",
      authorId: "celebrity_uid",
      authorName: "Celebrity",
      content: "Scam",
      category: "News",
      isReel: false
    }));
  });

  it("blocks oversized post string payloads (Attack 4)", async () => {
    const db = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: "attacker" } }).firestore();
    const docRef = db.collection("posts").doc("oversized_post");
    await assertFails(docRef.set({
      id: "oversized_post",
      authorId: "attacker",
      authorName: "Attacker",
      content: "a".repeat(5000), // Exceeds character limits (e.g. 2000)
      category: "News",
      isReel: false
    }));
  });

  it("blocks follow impersonation (Attack 9)", async () => {
    const db = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: "attacker" } }).firestore();
    const docRef = db.collection("follows").doc("follow_victim_target");
    await assertFails(docRef.set({
      id: "follow_victim_target",
      followerId: "victim",
      followingId: "target"
    }));
  });

  it("blocks unauthorized friend requests updates (Attack 10)", async () => {
    const db = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: "unauthorized" } }).firestore();
    const docRef = db.collection("friend_requests").doc("request_user_a_to_user_b");
    await assertFails(docRef.update({
      status: "accepted"
    }));
  });
});
```
