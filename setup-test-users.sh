#!/bin/bash

echo "Creating test users..."

# Create a student user
echo -e "\n📚 Creating student user..."
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@vesdm.com",
    "password": "student123",
    "name": "Test Student",
    "role": "student"
  }'

# Create a franchisee user
echo -e "\n\n🏢 Creating franchisee user..."
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "franchise@vesdm.com",
    "password": "franchise123",
    "name": "Test Franchise",
    "role": "franchisee"
  }'

echo -e "\n\n✅ Test users created!"
echo -e "\n📋 Login Credentials:"
echo -e "\n👨‍💼 Admin:"
echo "  Email: admin@vesdm.com"
echo "  Password: admin123"
echo -e "\n📚 Student:"
echo "  Email: student@vesdm.com"
echo "  Password: student123"
echo -e "\n🏢 Franchisee:"
echo "  Email: franchise@vesdm.com"
echo "  Password: franchise123"
