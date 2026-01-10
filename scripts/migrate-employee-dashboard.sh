#!/bin/bash

# Employee Dashboard Database Migration Script
# This script applies the device_assignments table migration to your Supabase database

echo "🚀 Starting Employee Dashboard Migration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Supabase credentials."
    exit 1
fi

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: VITE_SUPABASE_URL not set in .env file!"
    exit 1
fi

# Prefer DIRECT_URL for migrations (Session Mode), fallback to cleaned DATABASE_URL
if [ -n "$DIRECT_URL" ]; then
    echo "✓ Using DIRECT_URL for migration (Session Mode)"
    MIGRATION_URL="$DIRECT_URL"
elif [ -n "$DATABASE_URL" ]; then
    echo "✓ Using DATABASE_URL for migration"
    # Clean the DATABASE_URL by removing pgbouncer parameter
    MIGRATION_URL=$(echo "$DATABASE_URL" | sed 's/?pgbouncer=true//g' | sed 's/&pgbouncer=true//g')
else
    echo "❌ Error: Neither DIRECT_URL nor DATABASE_URL is set in .env file!"
    exit 1
fi

echo ""
echo "📋 Migration Details:"
echo "   - Creating device_assignments table"
echo "   - Adding RLS policies for data security"
echo "   - Creating triggers for automatic updates"
echo "   - Adding PostgreSQL functions for analytics"
echo ""

# Run the migration
echo "🔄 Applying migration..."
psql "$MIGRATION_URL" -f prisma/migrations/add_device_assignments/migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 What was created:"
    echo "   ✓ device_assignments table with indexes"
    echo "   ✓ RLS policies for admin and employee access"
    echo "   ✓ Automatic device.assigned_to synchronization"
    echo "   ✓ get_employee_statistics() function"
    echo "   ✓ get_employee_work_history() function"
    echo "   ✓ get_employee_maintenance_followup() function"
    echo ""
    echo "🎉 Your employee dashboard is ready to use!"
    echo "   Run 'npm run dev' to start the application."
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
