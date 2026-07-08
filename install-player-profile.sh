#!/bin/bash

echo "🎮 Installing Player Profile Feature..."
echo ""

# Install Chart.js
echo "📊 Installing Chart.js for rating graphs..."
cd client
npm install chart.js react-chartjs-2

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your backend server (npm run dev in project root)"
echo "2. Restart your frontend server (npm run dev in client folder)"
echo "3. Navigate to /players/:userId to see the profile"
echo ""
echo "🎉 Done! Check PLAYER-PROFILE-SETUP.md for full documentation."
