#!/usr/bin/env node

/**
 * Setup script to initialize a new project from projectK template
 * 
 * Usage:
 *   npm run setup
 *   or
 *   npx projectk-setup
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('\n🚀 ProjectK Setup Wizard\n');
  console.log('This will help you initialize a new project from the projectK template.\n');

  try {
    // Get project details
    const projectName = await question('Project name (e.g., client-payroll-system): ');
    const projectDescription = await question('Project description: ');
    const author = await question('Author name: ');
    const repositoryUrl = await question('Repository URL (optional, press Enter to skip): ');

    if (!projectName) {
      console.log('❌ Project name is required');
      process.exit(1);
    }

    // Read current package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Update package.json
    packageJson.name = projectName;
    if (projectDescription) packageJson.description = projectDescription;
    if (author) packageJson.author = author;
    if (repositoryUrl) {
      packageJson.repository = {
        type: 'git',
        url: repositoryUrl,
      };
    }

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('\n✅ Updated package.json');

    // Create .env.example if it doesn't exist
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      const envExample = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# SendGrid (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
`;
      fs.writeFileSync(envExamplePath, envExample);
      console.log('✅ Created .env.example');
    }

    // Update README if it exists
    const readmePath = path.join(process.cwd(), 'README.md');
    if (fs.existsSync(readmePath)) {
      let readme = fs.readFileSync(readmePath, 'utf8');
      readme = readme.replace(/Enterprise Payroll Management System/g, projectName);
      if (projectDescription) {
        readme = readme.replace(/A multi-tenant SaaS payroll management system/g, projectDescription);
      }
      fs.writeFileSync(readmePath, readme);
      console.log('✅ Updated README.md');
    }

    console.log('\n✨ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and fill in your Firebase credentials');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    console.log('\n📚 For more information, see README.md\n');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setup();

