document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('edges-input');
    const submitBtn = document.getElementById('submit-btn');
    const outputArea = document.getElementById('json-output');
    const errorMsg = document.getElementById('error');
    const loadingIndicators = document.getElementById('loading');

    const API_URL = 'http://localhost:3000/bfhl';

    submitBtn.addEventListener('click', async () => {
        // Reset states
        errorMsg.classList.add('hidden');
        outputArea.textContent = '';
        loadingIndicators.classList.remove('hidden');
        console.log("--- Submit clicked ---");
        
        let reqData;

        try {
            const rawVal = inputArea.value.trim();
            if (!rawVal) {
                throw new Error("Input cannot be empty.");
            }
            
            try {
                reqData = JSON.parse(rawVal);
                console.log("Parsed request data:", reqData);
            } catch (e) {
                throw new Error("Input must be a valid JSON array of strings. e.g [\"A->B\", \"A->C\"]");
            }

            if (!Array.isArray(reqData)) {
                throw new Error("Input must be a valid JSON array.");
            }

        } catch (err) {
            console.warn("Input validation error:", err.message);
            loadingIndicators.classList.add('hidden');
            errorMsg.textContent = err.message;
            errorMsg.classList.remove('hidden');
            return;
        }

        try {
            console.log(`Sending POST request to ${API_URL}`);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: reqData })
            });

            console.log("Response status:", response.status);
            const result = await response.json();
            console.log("Response body:", result);
            
            loadingIndicators.classList.add('hidden');

            if (!response.ok) {
                errorMsg.textContent = result.error || "An error occurred from server.";
                errorMsg.classList.remove('hidden');
            } else {
                outputArea.textContent = JSON.stringify(result, null, 2);
            }

        } catch (err) {
            console.error("Fetch error:", err);
            loadingIndicators.classList.add('hidden');
            errorMsg.textContent = "Failed to connect to the backend server. Make sure it is running on http://localhost:3000.";
            errorMsg.classList.remove('hidden');
        }
    });

    // Populate default example
    inputArea.value = '[\n  "A->B",\n  "A->C",\n  "B->D"\n]';
});
