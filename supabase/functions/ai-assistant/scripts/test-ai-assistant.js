// Save this as scripts/test-ai-assistant.js
// Run with: node scripts/test-ai-assistant.js
const http = require('http');

// Configuration – change these
const FUNCTION_URL = 'http://localhost:54321/functions/v1/ai-assistant'; // local
// For deployed, use: https://<project-ref>.supabase.co/functions/v1/ai-assistant
const USER_ID = '21417b9e-f679-4df3-87e8-4a3feca04b1f'; // Replace with a real user ID from your users table

// Helper to make POST requests
function postRequest(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const url = new URL(FUNCTION_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                // If your function requires authorization, add it here
                // 'Authorization': 'Bearer your-anon-key',
            },
        };
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${responseData}`));
                }
            });
        });
        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
    });
}

async function testChat() {
    console.log('\n📝 Testing Chat...');
    const payload = {
        action: 'chat',
        data: {
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'What is the capital of France?' }
            ],
            userId: USER_ID,
        },
    };
    const result = await postRequest(payload);
    console.log('Chat response:', result.data);
    return result;
}

async function testAnalyze() {
    console.log('\n📊 Testing Analyze...');
    const payload = {
        action: 'analyze',
        data: {
            userId: USER_ID,
            period: 'month',
        },
    };
    const result = await postRequest(payload);
    console.log('Analyze response:', result.data);
    return result;
}

async function testRecommend() {
    console.log('\n💡 Testing Recommend...');
    const payload = {
        action: 'recommend',
        data: {
            userId: USER_ID,
            goal: 'improve math performance',
        },
    };
    const result = await postRequest(payload);
    console.log('Recommend response:', result.data);
    return result;
}

async function testSummarize() {
    console.log('\n📄 Testing Summarize...');
    const longText = `
    The Internet of Things (IoT) is a system of interrelated computing devices, mechanical and digital machines,
    objects, animals or people that are provided with unique identifiers and the ability to transfer data over a network
    without requiring human-to-human or human-to-computer interaction. The definition of the Internet of Things has
    evolved due to the convergence of multiple technologies, real-time analytics, machine learning, commodity sensors,
    and embedded systems. Traditional fields of embedded systems, wireless sensor networks, control systems, automation
    (including home and building automation), and others all contribute to enabling the Internet of Things.
  `;
    const payload = {
        action: 'summarize',
        data: {
            text: longText,
            maxLength: 150,
        },
    };
    const result = await postRequest(payload);
    console.log('Summarize response:', result.data);
    return result;
}

async function runAllTests() {
    console.log('🧪 Starting AI Assistant tests...\n');
    try {
        await testChat();
        await testAnalyze();
        await testRecommend();
        await testSummarize();
        console.log('\n✅ All tests completed successfully.');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runAllTests();