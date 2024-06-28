import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 3000 });

type ClientData = { id: string, color: string, room: string };
type RoomData = { clients: Set<WebSocket>, color: string };

const clients = new Map<WebSocket, ClientData>();
const rooms = new Map<string, RoomData>();

const colors = [
    '\x1b[32m', // Green
    '\x1b[33m', // Yellow
    '\x1b[34m', // Blue
    '\x1b[35m', // Magenta
    '\x1b[36m', // Cyan
    '\x1b[37m', // White
];

let colorIndex = 0;
const roomColors = new Map<string, string>();
const allColor = '\x1b[31m'; // Red
const resetColor = '\x1b[0m'; // Reset color
const greyColor = '\x1b[90m'; // Grey for non-informative parts

const getNextColor = () => colors[colorIndex++ % colors.length];

const broadcastMessage = (room: string, message: string, exclude?: WebSocket) => {
    const roomData = rooms.get(room);
    roomData?.clients.forEach(client => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

const notifyRoomCreation = (roomName: string, clientData: ClientData, ws: WebSocket, timestamp: string) => {
    const roomColor = roomColors.get(roomName) || '\x1b[37m';
    const creationMessage = `${greyColor}[${timestamp}] ${clientData.color}${clientData.id}${resetColor}${greyColor} criou Sala ${roomColor}${roomName}${resetColor}`;
    broadcastMessage('all', creationMessage, ws);
    
    const entryMessage = `${greyColor}[${timestamp}] ${clientData.color}${clientData.id}${resetColor}${greyColor} entrou na Sala ${roomColor}${roomName}${resetColor}`;
    broadcastMessage(roomName, entryMessage, ws);

    ws.send(`${greyColor}[${timestamp}] Você criou a sala ${roomColor}${roomName}${resetColor}`);
    ws.send(`${greyColor}[${timestamp}] Você entrou na sala ${roomColor}${roomName}${resetColor}`);
};

const switchRoom = (oldRoom: string, newRoom: string, clientData: ClientData, ws: WebSocket) => {
    rooms.get(oldRoom)?.clients.delete(ws);
    broadcastMessage(oldRoom, `${greyColor}[${new Date().toLocaleTimeString()}] ${clientData.color}${clientData.id}${resetColor}${greyColor} saiu da sala${resetColor}`);

    clientData.room = newRoom;
    rooms.get(newRoom)?.clients.add(ws);

    const newRoomColor = roomColors.get(newRoom) || '\x1b[37m';
    ws.send(`${greyColor}[${new Date().toLocaleTimeString()}] Você entrou na sala ${newRoomColor}${newRoom}${resetColor}`);
    broadcastMessage(newRoom, `${greyColor}[${new Date().toLocaleTimeString()}] ${clientData.color}${clientData.id}${resetColor}${greyColor} entrou na sala${resetColor}`, ws);
};

const handleClientMessage = (ws: WebSocket, message: string) => {
    const clientData = clients.get(ws);
    if (!clientData) return;

    const timestamp = new Date().toLocaleTimeString();
    const parsedMessage = message.trim();

    if (parsedMessage.startsWith('/create ')) {
        const roomName = parsedMessage.split(' ')[1];
        if (roomName && !rooms.has(roomName)) {
            const roomColor = getNextColor();
            rooms.set(roomName, { clients: new Set(), color: roomColor });
            roomColors.set(roomName, roomColor);
            
            rooms.get(clientData.room)?.clients.delete(ws);
            clientData.room = roomName;
            rooms.get(roomName)?.clients.add(ws);

            notifyRoomCreation(roomName, clientData, ws, timestamp);
        } else {
            const existingRoomColor = roomColors.get(roomName) || '\x1b[37m';
            ws.send(`${greyColor}[${timestamp}] Sala ${existingRoomColor}${roomName}${resetColor}${greyColor} já existe${resetColor}`);
        }
    } else if (parsedMessage.startsWith('/join ')) {
        const roomName = parsedMessage.split(' ')[1];
        if (roomName && rooms.has(roomName)) {
            switchRoom(clientData.room, roomName, clientData, ws);
        } else {
            ws.send(`${greyColor}[${timestamp}] Sala ${roomName} não existe${resetColor}`);
        }
    } else if (parsedMessage.startsWith('/exit')) {
        if (clientData.room === 'all') {
            ws.send(`${greyColor}[${timestamp}] Você já está na sala ${allColor}all${resetColor}`);
        } else {
            switchRoom(clientData.room, 'all', clientData, ws);
        }
    } else if (parsedMessage.startsWith('/w ')) {
        const [_, recipientId, ...messageParts] = parsedMessage.split(' ');
        const privateMessage = messageParts.join(' ');
        const recipient = [...clients.entries()].find(([_, data]) => data.id === recipientId);

        if (recipient) {
            const [recipientClient, recipientData] = recipient;
            const formattedMessage = `[/w][${recipientData.id}] [ ${timestamp} ] ${clientData.color}${clientData.id}\x1b[0m: ${privateMessage}`;
            recipientClient.send(formattedMessage);
            ws.send(formattedMessage);
        } else {
            ws.send(`${greyColor}[${timestamp}] Usuário ${recipientId} não encontrado${resetColor}`);
        }
    } else if (parsedMessage.startsWith('/list')) {
        const roomList = Array.from(rooms.entries()).map(([name, { clients }]) => `${name}: ${clients.size} usuário(s)`).join('\n');
        ws.send(`${greyColor}[${timestamp}] Salas existentes:\n${roomList}${resetColor}`);
    } else if (parsedMessage.startsWith('/who')) {
        const room = rooms.get(clientData.room);
        if (room) {
            const userList = Array.from(room.clients).map(client => clients.get(client)!.id).join(', ');
            ws.send(`${greyColor}[${timestamp}] Usuários na sala ${roomColors.get(clientData.room)}${clientData.room}${resetColor}${greyColor} (${room.clients.size}): ${userList}${resetColor}`);
        }
    } else {
        const roomColor = roomColors.get(clientData.room) || '\x1b[37m';
        const formattedMessage = `[${roomColor}${clientData.room}\x1b[0m] [ ${timestamp} ] ${clientData.color}${clientData.id}\x1b[0m: ${parsedMessage}`;
        console.log(formattedMessage);
        broadcastMessage(clientData.room, formattedMessage);
    }
};

wss.on('connection', (ws) => {
    const clientId = uuidv4().split('-')[0];
    const clientColor = getNextColor();
    const clientData: ClientData = { id: clientId, color: clientColor, room: 'all' };

    clients.set(ws, clientData);

    if (!rooms.has('all')) {
        rooms.set('all', { clients: new Set(), color: allColor });
        roomColors.set('all', allColor);
    }
    rooms.get('all')!.clients.add(ws);

    console.log(`[ ${new Date().toLocaleTimeString()} ] Client ${clientColor}${clientId}${resetColor} connected`);
    broadcastMessage('all', `${greyColor}[${new Date().toLocaleTimeString()}] ${clientColor}${clientId}${resetColor}${greyColor} entrou na sala ${allColor}all${resetColor}`);

    ws.on('message', (message) => handleClientMessage(ws, message.toString()));
    ws.on('close', () => {
        const clientData = clients.get(ws);
        if (clientData) {
            rooms.get(clientData.room)!.clients.delete(ws);
            clients.delete(ws);

            console.log(`[ ${new Date().toLocaleTimeString()} ] ${clientData.color}${clientData.id}${resetColor} disconnected`);
            broadcastMessage(clientData.room, `${greyColor}[${new Date().toLocaleTimeString()}] ${clientData.color}${clientData.id}${resetColor}${greyColor} saiu da sala${resetColor}`);
        }
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        const clientData = clients.get(ws);
        if (clientData) {
            rooms.get(clientData.room)!.clients.delete(ws);
            clients.delete(ws);
        }
    });

    ws.send(`Welcome to the WebSocket server! Your ID is ${clientColor}${clientId}\x1b[0m`);
});

console.log('WebSocket server running on ws://localhost:3000');
