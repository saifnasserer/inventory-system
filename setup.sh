#!/bin/bash

echo "🚀 Setting up Inventory Management System..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and add your Supabase credentials:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo ""
    echo "You can get these from your Supabase project dashboard."
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

echo "🗄️  Database Setup Instructions:"
echo ""
echo "1. Go to your Supabase project: https://supabase.com/dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy the contents of 'supabase-schema.sql'"
echo "4. Paste and run the SQL script"
echo ""
read -p "Press Enter after you've set up the database..."

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Make sure your .env file has the correct Supabase credentials"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Open http://localhost:5173 in your browser"
echo ""
echo "📚 For more information, check README.md and SUPABASE_SETUP.md"
echo ""
