import WebSocket from 'ws';
import readline from 'readline';

const url = 'ws://localhost:3000';
const connection = new WebSocket(url);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

const handleUserInput = (input: string) => {
    connection.send(input);
    if (!input.startsWith('/')) {
        readline.moveCursor(process.stdout, 0, -1); // Move the cursor up to overwrite the input
        readline.clearLine(process.stdout, 0); // Clear the line
    }
};

connection.onopen = () => {
    console.log('Connected to server');
    rl.on('line', handleUserInput);
};

connection.onmessage = (event) => {
    console.log(event.data);
};

connection.onclose = () => {
    console.log('Disconnected from server');
    rl.close();
};

connection.onerror = (error) => {
    console.error('WebSocket error:', error);
    rl.close();
};
