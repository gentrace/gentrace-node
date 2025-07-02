#!/usr/bin/env node

/**
 * Deploy to Verdaccio Script for gentrace-node
 *
 * This script automates the process of building and publishing the gentrace
 * package to a local Verdaccio registry for testing purposes.
 *
 * Prerequisites:
 *   - Verdaccio must be installed: npm install -g verdaccio
 *   - Verdaccio must be running: verdaccio (in another terminal)
 *
 * Usage:
 *   node deploy-to-verdaccio.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration - can be overridden by environment variables
const CONFIG = {
  verdaccioUrl: process.env.VERDACCIO_URL || 'http://localhost:4873',
  packageName: process.env.PACKAGE_NAME || 'gentrace',
  autoAuth: process.env.VERDACCIO_AUTO_AUTH === 'true',
  verbose: process.env.VERBOSE === 'true',
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Execute shell command with proper error handling and output
 * @param {string} command - Command to execute
 * @param {object} options - Options for execSync
 * @returns {string} - Command output
 */
function exec(command, options = {}) {
  console.log(`${colors.cyan}> ${command}${colors.reset}`);
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    console.error(`${colors.red}Error executing: ${command}${colors.reset}`);
    throw error;
  }
}

/**
 * Check if Verdaccio is running using Node.js http/https modules
 * @returns {Promise<boolean>} - True if Verdaccio is accessible
 */
function isVerdaccioRunning() {
  return new Promise((resolve) => {
    const url = new URL(CONFIG.verdaccioUrl);
    const client = url.protocol === 'https:' ? https : http;

    const request = client.get(CONFIG.verdaccioUrl, (res) => {
      resolve(res.statusCode === 200);
    });

    request.on('error', () => resolve(false));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Get current package version from package.json
 * @returns {string} - Package version
 */
function getPackageVersion() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found in current directory');
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

/**
 * Log with optional verbose mode
 * @param {string} message - Message to log
 * @param {boolean} forceShow - Show regardless of verbose setting
 */
function log(message, forceShow = false) {
  if (CONFIG.verbose || forceShow) {
    console.log(message);
  }
}

/**
 * Main deployment function
 */
async function deploy() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('=========================================');
  console.log('  Deploying gentrace to Local Verdaccio  ');
  console.log('=========================================');
  console.log(`${colors.reset}`);

  // Display configuration when verbose
  if (CONFIG.verbose) {
    console.log(`\nConfiguration:`);
    console.log(`  Verdaccio URL: ${CONFIG.verdaccioUrl}`);
    console.log(`  Package Name: ${CONFIG.packageName}`);
    console.log(`  Auto Auth: ${CONFIG.autoAuth}`);
    console.log(`  Verbose: ${CONFIG.verbose}\n`);
  }

  try {
    // Step 1: Check if Verdaccio is running
    console.log(`\n${colors.bright}Step 1: Checking Verdaccio status...${colors.reset}`);
    if (!(await isVerdaccioRunning())) {
      console.error(`${colors.red}✗ Verdaccio is not running!${colors.reset}`);
      console.log(`\nPlease start Verdaccio in another terminal:`);
      console.log(`  ${colors.cyan}verdaccio${colors.reset}`);
      console.log(`\nVerdaccio will run at: ${colors.yellow}${CONFIG.verdaccioUrl}${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✓ Verdaccio is running at ${CONFIG.verdaccioUrl}${colors.reset}`);

    // Step 2: Install dependencies
    console.log(`\n${colors.bright}Step 2: Installing dependencies...${colors.reset}`);
    if (!fs.existsSync('node_modules')) {
      exec('yarn install');
    } else {
      log(`${colors.green}✓ Dependencies already installed${colors.reset}`, true);
    }

    // Step 3: Build the package
    console.log(`\n${colors.bright}Step 3: Building package...${colors.reset}`);
    exec('yarn build');
    console.log(`${colors.green}✓ Build completed${colors.reset}`);

    // Verify dist directory exists
    if (!fs.existsSync('dist')) {
      throw new Error('Build failed: dist directory not found');
    }

    // Step 4: Get package version
    const version = getPackageVersion();
    console.log(`\n${colors.bright}Step 4: Package information${colors.reset}`);
    console.log(`  Name: ${colors.yellow}${CONFIG.packageName}${colors.reset}`);
    console.log(`  Version: ${colors.yellow}${version}${colors.reset}`);

    // Step 5: Configure npm to use Verdaccio (temporarily)
    console.log(`\n${colors.bright}Step 5: Configuring npm registry...${colors.reset}`);
    const originalRegistry = execSync('npm config get registry', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
    console.log(`  Original registry: ${originalRegistry}`);
    console.log(`  Temporary registry: ${CONFIG.verdaccioUrl}`);

    // Step 6: Check if user exists in Verdaccio
    console.log(`\n${colors.bright}Step 6: Checking Verdaccio authentication...${colors.reset}`);
    try {
      execSync(`npm whoami --registry ${CONFIG.verdaccioUrl}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      console.log(`${colors.green}✓ Already authenticated with Verdaccio${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}! Not authenticated, creating user...${colors.reset}`);

      // Check if we should use default credentials for local testing
      if (CONFIG.autoAuth) {
        console.log(`  Using default test credentials...`);
        // Create a default user for testing
        const authCommand = `npm-cli-login -u testuser -p testpass -e test@example.com -r ${CONFIG.verdaccioUrl}`;
        try {
          exec(authCommand);
          console.log(`${colors.green}✓ Created test user successfully${colors.reset}`);
        } catch (authError) {
          console.log(`  npm-cli-login not available, please authenticate manually:`);
          exec(`npm adduser --registry ${CONFIG.verdaccioUrl}`);
        }
      } else {
        console.log(`\nPlease enter credentials for Verdaccio:`);
        console.log(`  (Tip: Set VERDACCIO_AUTO_AUTH=true to use default test credentials)`);
        exec(`npm adduser --registry ${CONFIG.verdaccioUrl}`);
      }
    }

    // Step 7: Check if package already exists and unpublish if needed
    console.log(`\n${colors.bright}Step 7: Checking for existing package...${colors.reset}`);
    try {
      execSync(`npm view ${CONFIG.packageName}@${version} --registry ${CONFIG.verdaccioUrl}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      console.log(`${colors.yellow}! Package ${CONFIG.packageName}@${version} already exists${colors.reset}`);
      console.log(`  Unpublishing existing version...`);
      try {
        exec(`npm unpublish ${CONFIG.packageName}@${version} --force --registry ${CONFIG.verdaccioUrl}`);
        console.log(`${colors.green}✓ Unpublished existing version${colors.reset}`);
      } catch (unpublishError) {
        console.log(`${colors.yellow}! Could not unpublish, will try to overwrite${colors.reset}`);
      }
    } catch (error) {
      console.log(`  No existing version found, proceeding with publish`);
    }

    // Step 8: Publish to Verdaccio from dist directory
    console.log(`\n${colors.bright}Step 8: Publishing to Verdaccio...${colors.reset}`);
    try {
      // The package requires publishing from the dist directory
      const publishCommand = `cd dist && npm publish --registry ${CONFIG.verdaccioUrl} --force`;
      exec(publishCommand);
      console.log(
        `${colors.green}✓ Successfully published ${CONFIG.packageName}@${version} to Verdaccio${colors.reset}`,
      );
    } catch (error) {
      if (error.message && error.message.includes('conflict')) {
        console.log(`${colors.red}✗ Version conflict - could not overwrite${colors.reset}`);
        console.log(
          `  Try manually unpublishing: ${colors.cyan}npm unpublish ${CONFIG.packageName} --force --registry ${CONFIG.verdaccioUrl}${colors.reset}`,
        );
      } else {
        throw error;
      }
    }

    // Step 9: Display usage instructions
    console.log(`\n${colors.bright}${colors.green}✓ Deployment Complete!${colors.reset}`);
    console.log(`\n${colors.bright}To use this package in another project:${colors.reset}`);
    console.log(`\n1. Using temporary registry:`);
    console.log(
      `   ${colors.cyan}npm install ${CONFIG.packageName} --registry ${CONFIG.verdaccioUrl}${colors.reset}`,
    );
    console.log(`\n2. Using .npmrc file (create in your project):`);
    console.log(`   ${colors.cyan}echo "registry=${CONFIG.verdaccioUrl}" > .npmrc${colors.reset}`);
    console.log(`   ${colors.cyan}npm install ${CONFIG.packageName}${colors.reset}`);
    console.log(`\n3. View in Verdaccio web UI:`);
    console.log(`   ${colors.cyan}${CONFIG.verdaccioUrl}/-/web/detail/${CONFIG.packageName}${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Deployment failed${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Deployment interrupted${colors.reset}`);
  process.exit(1);
});

// Parse command line arguments for help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node deploy-to-verdaccio.js [options]

Options:
  --help, -h     Show this help message

Environment Variables:
  VERDACCIO_URL        URL of Verdaccio registry (default: http://localhost:4873)
  PACKAGE_NAME         Package name to publish (default: gentrace)
  VERDACCIO_AUTO_AUTH  Use default test credentials (default: false)
  VERBOSE              Enable verbose logging (default: false)
`);
  process.exit(0);
}

// Run the deployment
deploy().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
