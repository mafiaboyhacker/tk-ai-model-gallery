#!/usr/bin/env node

/**
 * Security Verification Script for TK AI Model Gallery
 * Validates environment configuration before deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

// Security check results
let checkResults = {
  passed: 0,
  warnings: 0,
  errors: 0,
  critical: 0,
};

/**
 * Print colored console message
 */
function printMessage(level, message, details = '') {
  const levelColors = {
    PASS: colors.green,
    WARN: colors.yellow,
    ERROR: colors.red,
    CRITICAL: colors.red + colors.bold,
    INFO: colors.blue,
  };

  const icon = {
    PASS: '✅',
    WARN: '⚠️ ',
    ERROR: '❌',
    CRITICAL: '🚨',
    INFO: 'ℹ️ ',
  };

  console.log(
    `${levelColors[level]}${icon[level]} ${message}${colors.reset}${
      details ? '\n   ' + details : ''
    }`
  );

  checkResults[level.toLowerCase() === 'pass' ? 'passed' : level.toLowerCase()]++;
}

/**
 * Check if a file exists and is readable
 */
function checkFileExists(filePath, description) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    printMessage('ERROR', `Missing ${description}`, `File not found: ${filePath}`);
    return false;
  }
}

/**
 * Load environment file safely
 */
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...values] = line.split('=');
        env[key.trim()] = values.join('=').trim().replace(/^["'](.+)["']$/, '$1');
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

/**
 * Validate individual environment variable
 */
function validateEnvVar(env, key, checks = {}) {
  const value = env[key];
  
  if (!value) {
    if (checks.required) {
      printMessage('ERROR', `Missing required variable: ${key}`);
      return false;
    } else {
      printMessage('WARN', `Optional variable not set: ${key}`);
      return true;
    }
  }

  // Check for placeholder values
  const placeholders = [
    'your-secret-key-here',
    'change-this-password',
    'GENERATE_',
    'YOUR_',
    'placeholder',
    'example.com',
    'localhost',
  ];
  
  if (placeholders.some(placeholder => value.includes(placeholder))) {
    printMessage('CRITICAL', `Placeholder value detected in ${key}`, `Value: ${value}`);
    return false;
  }

  // Specific checks
  if (checks.minLength && value.length < checks.minLength) {
    printMessage('ERROR', `${key} too short (minimum ${checks.minLength} characters)`, `Current length: ${value.length}`);
    return false;
  }

  if (checks.pattern && !checks.pattern.test(value)) {
    printMessage('ERROR', `${key} doesn't match required pattern`);
    return false;
  }

  if (checks.urlCheck && !value.startsWith('http')) {
    printMessage('ERROR', `${key} must be a valid URL`);
    return false;
  }

  printMessage('PASS', `${key} validation passed`);
  return true;
}

/**
 * Check for exposed credentials in current .env.local
 */
function checkForExposedCredentials(env) {
  const knownCompromisedValues = [
    'hjovusgefakpcwghoixk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb3Z1c2dlZmFrcGN3Z2hvaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjEyODIsImV4cCI6MjA3MzM5NzI4Mn0.xTKEV7f3ac3dQU_pD48Sefy6QYQWU7bg1Ci-Q7Z-kvk',
    'sb_secret_ROQAqeNFDTssrjZzV2zshg_FA2fXApm',
  ];

  let hasCompromisedCredentials = false;

  Object.entries(env).forEach(([key, value]) => {
    if (knownCompromisedValues.includes(value)) {
      printMessage('CRITICAL', `EXPOSED CREDENTIAL DETECTED: ${key}`, 'This credential was previously exposed and MUST be rotated');
      hasCompromisedCredentials = true;
    }
  });

  if (!hasCompromisedCredentials) {
    printMessage('PASS', 'No known compromised credentials detected');
  }

  return !hasCompromisedCredentials;
}

/**
 * Check gitignore configuration
 */
function checkGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!checkFileExists(gitignorePath, '.gitignore file')) {
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const requiredPatterns = ['.env*', '*.env', '.env.local'];
  
  let allPatternsFound = true;
  requiredPatterns.forEach(pattern => {
    if (!gitignoreContent.includes(pattern)) {
      printMessage('ERROR', `Missing .gitignore pattern: ${pattern}`);
      allPatternsFound = false;
    }
  });

  if (allPatternsFound) {
    printMessage('PASS', '.gitignore properly configured for environment files');
  }

  return allPatternsFound;
}

/**
 * Check for environment files that shouldn't exist
 */
function checkForSensitiveFiles() {
  const sensitiveFiles = [
    '.env.production',
    '.env.staging',
    'credentials.json',
    'secrets.json',
  ];

  let foundSensitiveFiles = false;
  sensitiveFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      printMessage('WARN', `Sensitive file found: ${file}`, 'Consider removing or securing this file');
      foundSensitiveFiles = true;
    }
  });

  if (!foundSensitiveFiles) {
    printMessage('PASS', 'No sensitive files found in working directory');
  }

  return !foundSensitiveFiles;
}

/**
 * Main security check function
 */
function runSecurityChecks() {
  console.log(`${colors.bold}🛡️  TK AI Model Gallery - Security Verification${colors.reset}\n`);

  // Check for required files
  printMessage('INFO', 'Checking required configuration files...');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envTemplatePath = path.join(process.cwd(), '.env.template');
  
  // Load environment file
  let env = null;
  if (checkFileExists(envLocalPath, '.env.local file')) {
    env = loadEnvFile(envLocalPath);
    if (!env) {
      printMessage('ERROR', 'Failed to parse .env.local file');
      return;
    }
  } else {
    printMessage('INFO', 'No .env.local found, checking .env.template...');
    if (checkFileExists(envTemplatePath, '.env.template file')) {
      printMessage('PASS', 'Environment template exists for setup guidance');
    }
    return;
  }

  // Check for exposed/compromised credentials
  printMessage('INFO', '\nChecking for exposed credentials...');
  checkForExposedCredentials(env);

  // Validate environment variables
  printMessage('INFO', '\nValidating environment variables...');
  
  const envValidation = {
    'NEXT_PUBLIC_SUPABASE_URL': { 
      required: true, 
      urlCheck: true 
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': { 
      required: true, 
      minLength: 100 
    },
    'SUPABASE_SERVICE_ROLE_KEY': { 
      required: true, 
      minLength: 100 
    },
    'NEXTAUTH_SECRET': { 
      required: true, 
      minLength: 32 
    },
    'NEXTAUTH_URL': { 
      required: true, 
      urlCheck: true 
    },
    'ADMIN_EMAIL': { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    },
    'ADMIN_PASSWORD': { 
      required: true, 
      minLength: 12 
    },
  };

  Object.entries(envValidation).forEach(([key, checks]) => {
    validateEnvVar(env, key, checks);
  });

  // Additional security checks
  printMessage('INFO', '\nRunning additional security checks...');
  checkGitignore();
  checkForSensitiveFiles();

  // Summary
  printMessage('INFO', '\n📊 Security Check Summary');
  console.log(`   ✅ Passed: ${checkResults.passed}`);
  console.log(`   ⚠️  Warnings: ${checkResults.warnings}`);
  console.log(`   ❌ Errors: ${checkResults.errors}`);
  console.log(`   🚨 Critical: ${checkResults.critical}`);

  const totalIssues = checkResults.errors + checkResults.critical;
  
  if (totalIssues === 0) {
    printMessage('PASS', '\n🎉 Security validation passed! Ready for deployment.');
    console.log(`\n${colors.green}Next steps:${colors.reset}`);
    console.log('1. Review SECURE_DEPLOYMENT_CHECKLIST.md');
    console.log('2. Set up Vercel environment variables using VERCEL_ENV_SETUP_GUIDE.md');
    console.log('3. Deploy with confidence! 🚀');
  } else {
    printMessage('ERROR', `\n🚫 Security validation failed with ${totalIssues} critical issue(s).`);
    console.log(`\n${colors.red}Required actions:${colors.reset}`);
    console.log('1. Fix all critical and error-level issues');
    console.log('2. Rotate any exposed credentials immediately');
    console.log('3. Re-run this security check');
    console.log('4. Only deploy after all issues are resolved');
  }

  return totalIssues === 0;
}

// Run the security checks
if (require.main === module) {
  const passed = runSecurityChecks();
  process.exit(passed ? 0 : 1);
}

module.exports = { runSecurityChecks };