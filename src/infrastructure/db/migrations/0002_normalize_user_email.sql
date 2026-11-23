-- Custom data migration (change: email-value-object).
-- Better-Auth stores and looks up emails lowercased; users created through
-- POST /api/v1/users before this change kept the case as typed and cannot log in.
-- Normalize them (trim + lowercase), skipping any row whose normalized email
-- would collide with another user. Colliding rows must be resolved manually:
--   SELECT lower(trim(email)), array_agg(email) FROM "user" GROUP BY 1 HAVING count(*) > 1;
UPDATE "user" AS u
SET "email" = lower(trim(u."email")), "updated_at" = now()
WHERE u."email" <> lower(trim(u."email"))
  AND NOT EXISTS (
    SELECT 1 FROM "user" AS o
    WHERE o."id" <> u."id" AND lower(trim(o."email")) = lower(trim(u."email"))
  );
