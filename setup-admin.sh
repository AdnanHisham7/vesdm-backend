#!/bin/bash

# Setup initial admin user
echo "Setting up initial admin user..."

curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vesdm.com",
    "password": "admin123",
    "name": "Admin User"
  }'

echo -e "\n\n✅ Admin user created!"
echo "Email: admin@vesdm.com"
echo "Password: admin123"
echo "Role: admin"
