// Manual test reference for the auth endpoints — not a test framework.
//
// POST /api/v1/auth/register
// curl -X POST http://localhost:3001/api/v1/auth/register \
//   -H "Content-Type: application/json" \
//   -d '{"email":"test@vakvic.com","password":"Test1234"}'
//
// POST /api/v1/auth/login
// curl -X POST http://localhost:3001/api/v1/auth/login \
//   -H "Content-Type: application/json" \
//   -d '{"email":"test@vakvic.com","password":"Test1234"}'
