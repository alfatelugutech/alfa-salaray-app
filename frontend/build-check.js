// Build check script to verify ESLint issues before deployment
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Checking for ESLint issues...');

try {
  // Check ESLint on Salary.jsx specifically
  execSync('npx eslint src/pages/Salary.jsx', { stdio: 'inherit' });
  console.log('✅ No ESLint errors found in Salary.jsx');
} catch (error) {
  console.error('❌ ESLint errors found:', error.message);
  process.exit(1);
}

console.log('🚀 Build check completed successfully!');
