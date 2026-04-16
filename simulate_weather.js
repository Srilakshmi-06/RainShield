const http = require('http');

const runSimulation = (name, url) => {
    return new Promise((resolve, reject) => {
        console.log(`\nScenario: ${name}`);
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                console.log('Result:', JSON.stringify(parsed.prediction, null, 2));
                console.log('Status:', parsed.prediction.status === 'HIGH' || parsed.prediction.status === 'High' ? '🚨 HIGH' : '✅ LOW');
                if (parsed.prediction.payoutAmount > 0) console.log('Payout: ₹', parsed.prediction.payoutAmount);
                resolve();
            });
        }).on('error', (err) => {
            console.error('Simulation Failed:', err.message);
            resolve();
        });
    });
};

const testSimulation = async () => {
    console.log('--- 🛡️ RainShield Simulation ---');
    await runSimulation('Normal Weather (0mm Rain, 30°C)', 'http://127.0.0.1:5000/api/monitor/status/Mumbai?rain=0&temp=30');
    await runSimulation('Heavy Rain Event (25mm Rain, 22°C)', 'http://127.0.0.1:5000/api/monitor/status/Mumbai?rain=25&temp=22');
};

testSimulation();
