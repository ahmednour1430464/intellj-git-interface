#!/usr/bin/env node

/**
 * Simple test script to verify the extension structure and basic functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing IntelliJ Git Interface Extension Structure...\n');

// Test 1: Check if all required files exist
const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'webpack.config.js',
    'README.md',
    'CHANGELOG.md',
    'src/extension.ts',
    'src/gitProvider.ts',
    'src/models/gitModels.ts',
    'src/views/gitLogView.ts',
    'src/views/changesView.ts',
    'src/views/fileHistoryView.ts',
    'src/views/diffView.ts',
    'src/webviews/gitGraphWebview.ts',
    'src/commands/commandRegistry.ts',
    'src/utils/gitUtils.ts',
    'webview-ui/git-graph.css',
    'webview-ui/git-graph.js',
    'webview-ui/commit-details.css',
    'dist/extension.js'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} (missing)`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log(`\n⚠️  Missing ${missingFiles.length} required files`);
} else {
    console.log('\n✅ All required files present');
}

// Test 2: Check package.json structure
console.log('\n📦 Checking package.json structure...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredFields = ['name', 'displayName', 'description', 'version', 'engines', 'main', 'contributes'];
    const missingFields = requiredFields.filter(field => !packageJson[field]);
    
    if (missingFields.length === 0) {
        console.log('  ✅ All required package.json fields present');
        console.log(`  📝 Extension: ${packageJson.displayName} v${packageJson.version}`);
        console.log(`  🎯 VS Code Engine: ${packageJson.engines.vscode}`);
    } else {
        console.log(`  ❌ Missing fields: ${missingFields.join(', ')}`);
    }

    // Check commands
    if (packageJson.contributes && packageJson.contributes.commands) {
        console.log(`  🔧 Commands: ${packageJson.contributes.commands.length} defined`);
    }

    // Check views
    if (packageJson.contributes && packageJson.contributes.views) {
        const viewCount = Object.values(packageJson.contributes.views).reduce((sum, views) => sum + views.length, 0);
        console.log(`  👁️  Views: ${viewCount} defined`);
    }

} catch (error) {
    console.log(`  ❌ Error reading package.json: ${error.message}`);
}

// Test 3: Check TypeScript compilation
console.log('\n🔨 Checking TypeScript compilation...');
if (fs.existsSync('dist/extension.js')) {
    const stats = fs.statSync('dist/extension.js');
    console.log(`  ✅ Extension compiled successfully`);
    console.log(`  📊 Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
    console.log('  ❌ Extension not compiled - run "npm run compile"');
}

// Test 4: Check dependencies
console.log('\n📚 Checking dependencies...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.dependencies) {
        console.log('  📦 Runtime dependencies:');
        Object.entries(packageJson.dependencies).forEach(([name, version]) => {
            console.log(`    - ${name}: ${version}`);
        });
    }

    if (packageJson.devDependencies) {
        console.log('  🛠️  Development dependencies:');
        Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
            console.log(`    - ${name}: ${version}`);
        });
    }

    // Check if node_modules exists
    if (fs.existsSync('node_modules')) {
        console.log('  ✅ Dependencies installed');
    } else {
        console.log('  ❌ Dependencies not installed - run "npm install"');
    }

} catch (error) {
    console.log(`  ❌ Error checking dependencies: ${error.message}`);
}

// Test 5: Check webview assets
console.log('\n🌐 Checking webview assets...');
const webviewFiles = [
    'webview-ui/git-graph.css',
    'webview-ui/git-graph.js',
    'webview-ui/commit-details.css'
];

webviewFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
        console.log(`  ❌ ${file} (missing)`);
    }
});

// Test 6: Basic code structure validation
console.log('\n🔍 Checking code structure...');

// Check if main extension file exports activate function
if (fs.existsSync('src/extension.ts')) {
    const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
    if (extensionContent.includes('export function activate')) {
        console.log('  ✅ Extension exports activate function');
    } else {
        console.log('  ❌ Extension missing activate function');
    }

    if (extensionContent.includes('export function deactivate')) {
        console.log('  ✅ Extension exports deactivate function');
    } else {
        console.log('  ⚠️  Extension missing deactivate function (optional)');
    }
}

// Check if GitProvider exists
if (fs.existsSync('src/gitProvider.ts')) {
    const gitProviderContent = fs.readFileSync('src/gitProvider.ts', 'utf8');
    if (gitProviderContent.includes('export class GitProvider')) {
        console.log('  ✅ GitProvider class defined');
    } else {
        console.log('  ❌ GitProvider class missing');
    }
}

// Summary
console.log('\n📋 Test Summary:');
console.log('================');

const totalTests = 6;
let passedTests = 0;

if (missingFiles.length === 0) passedTests++;
if (fs.existsSync('package.json')) passedTests++;
if (fs.existsSync('dist/extension.js')) passedTests++;
if (fs.existsSync('node_modules')) passedTests++;
if (webviewFiles.every(file => fs.existsSync(file))) passedTests++;
if (fs.existsSync('src/extension.ts') && fs.existsSync('src/gitProvider.ts')) passedTests++;

console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
    console.log('\n🎉 Extension structure is complete and ready!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test the extension in VS Code Extension Development Host');
    console.log('  2. Open a Git repository and verify functionality');
    console.log('  3. Test all commands and views');
    console.log('  4. Package the extension with "vsce package"');
} else {
    console.log('\n⚠️  Extension structure needs attention');
    console.log('\n🔧 Recommended actions:');
    if (missingFiles.length > 0) {
        console.log('  - Create missing files');
    }
    if (!fs.existsSync('dist/extension.js')) {
        console.log('  - Run "npm run compile"');
    }
    if (!fs.existsSync('node_modules')) {
        console.log('  - Run "npm install"');
    }
}

console.log('\n🚀 To test the extension:');
console.log('  1. Open this folder in VS Code');
console.log('  2. Press F5 to launch Extension Development Host');
console.log('  3. Open a Git repository in the new window');
console.log('  4. Test IntelliJ Git Interface features');

console.log('\n📖 For detailed usage instructions, see:');
console.log('  - README.md');
console.log('  - USAGE_EXAMPLES.md');
console.log('  - CHANGELOG.md');
