const testSimulation = async () => {
    console.log('--- 🛡️ RainShield Simulation ---');

    try {
        // 1. Normal Weather Simulation (0mm Rain, 30°C) - Should be LOW
        console.log('\nScenario 1: Normal Weather (0mm Rain, 30°C)');
        const normalRes = await fetch('http://localhost:5000/api/monitor/status/Mumbai?rain=0&temp=30');
        const normalData = await normalRes.json();
        console.log('Result:', JSON.stringify(normalData.prediction, null, 2));
        console.log('Status: ✅', normalData.prediction.status);

        // 2. Heavy Rain Simulation (25mm Rain, 22°C) - Should be HIGH
        console.log('\nScenario 2: Heavy Rain Event (25mm Rain, 22°C)');
        const rainRes = await fetch('http://localhost:5000/api/monitor/status/Mumbai?rain=25&temp=22');
        const rainData = await rainRes.json();
        console.log('Result:', JSON.stringify(rainData.prediction, null, 2));
        console.log('Status: 🚨', rainData.prediction.status);
        console.log('Recommended Payout: ₹', rainData.prediction.payoutAmount);

    } catch (error) {
        console.error('Simulation Failed:', error.message);
    }
};

testSimulation();
