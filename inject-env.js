const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Get the API key from environment variable
const apiKey = process.env.VITE_OPENAI_API_KEY;

if (apiKey) {
    // Inject the API key into the HTML
    const envScript = `<script>window.VERCEL_ENV_API_KEY = '${apiKey}';</script>`;
    indexContent = indexContent.replace(
        '<!-- Local development config (ignored by git) -->',
        `<!-- Environment variables injected by Vercel -->\n    ${envScript}\n    <!-- Local development config (ignored by git) -->`
    );
    
    // Write the modified file back
    fs.writeFileSync(indexPath, indexContent);
    console.log('Environment variable injected successfully');
} else {
    console.log('No API key found in environment variables');
}