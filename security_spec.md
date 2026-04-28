# Security Specification - Mood Walk

## Data Invariants
1. A `User` document's `userId` must match the document ID and the `request.auth.uid`.
2. A `JournalEntry` must belong to the user who created it (`userId` must match creator).
3. `stats` are aggregate and should only be updated when a new entry is added or when the user updates their profile (though bio/name shouldn't affect stats). Actually, stats are updated during `handleSaveJournal`.
4. Users can only read and write their own data.

## The "Dirty Dozen" Payloads (Attacker Payloads)

1. **Identity Theft**: User A tries to update User B's profile.
   - Path: `/users/USER_B`
   - Payload: `{ "name": "Hacker" }`
   - Expectation: `PERMISSION_DENIED`

2. **Shadow Field Injection**: User tries to add an `isAdmin` field to their profile.
   - Path: `/users/USER_A`
   - Payload: `{ "isAdmin": true, "name": "User A" }`
   - Expectation: `PERMISSION_DENIED`

3. **Entry Spoofing**: User A tries to create a `JournalEntry` in User B's collection.
   - Path: `/users/USER_B/entries/entry1`
   - Payload: `{ "content": "Spoofed", "userId": "USER_B" }`
   - Expectation: `PERMISSION_DENIED`

4. **Stats Inflation**: User tries to skip Tree Levels by manually setting `stats.treeLevel` to 100.
   - Path: `/users/USER_A`
   - Payload: `{ "stats": { "treeLevel": 100, ... } }`
   - Expectation: Should be restricted (e.g., only incrementing or validating against entries, but since this is client-side driven for now, we at least ensure owner-only). *Actually, we should enforce strict schema.*

5. **ID Poisoning**: Creating an entry with a 1MB string as ID.
   - Path: `/users/USER_A/entries/VERY_LONG_STRING...`
   - Expectation: `PERMISSION_DENIED`

6. **PII Leak**: Unauthenticated user tries to list all users.
   - Path: `/users`
   - Expectation: `PERMISSION_DENIED`

7. **Malicious Timestamp**: User tries to set a future `createdAt`.
   - Payload: `{ "createdAt": "2099-01-01T00:00:00Z" }`
   - Expectation: `PERMISSION_DENIED` (Use `request.time`)

8. **Orphaned Entry**: Creating a journal entry for a user that doesn't have a profile yet (relational check).
   - Expectation: `exists(/databases/$(database)/documents/users/$(userId))` check.

9. **Terminal State Bypass**: (N/A for this app as there isn't a strict workflow yet, but entries are immutable anyway).

10. **Type Mismatch**: Sending a string for `totalSteps`.
    - Payload: `{ "stats": { "totalSteps": "lots" } }`
    - Expectation: `PERMISSION_DENIED`

11. **Negative Steps**: Sending negative steps.
    - Payload: `{ "steps": -100 }`
    - Expectation: `PERMISSION_DENIED`

12. **Blanket Read Attack**: Trying to query entries without the `userId` filter.
    - Expectation: `resource.data.userId == request.auth.uid` check in `list`.

## Test Runner (firestore.rules.test.ts)
(To be implemented if needed, but I'll focus on the rules first).
