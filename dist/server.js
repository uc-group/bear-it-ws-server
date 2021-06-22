/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/Api.ts":
/*!********************!*\
  !*** ./src/Api.ts ***!
  \********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.post = exports.get = void 0;\nconst axios_1 = __webpack_require__(/*! axios */ \"axios\");\nconst get = async (url) => (axios_1.default.get(url).then((r) => r.data.data));\nexports.get = get;\nconst post = async (url, data) => (axios_1.default.post(url, data).then((r) => r.data.data));\nexports.post = post;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/Api.ts?");

/***/ }),

/***/ "./src/Server.ts":
/*!***********************!*\
  !*** ./src/Server.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst Client_1 = __webpack_require__(/*! ./client/Client */ \"./src/client/Client.ts\");\nconst Room_1 = __webpack_require__(/*! ./room/Room */ \"./src/room/Room.ts\");\nclass Server {\n    io;\n    auth;\n    rooms = [];\n    started = false;\n    clients = {};\n    systems = [];\n    constructor(io, auth) {\n        this.io = io;\n        this.auth = auth;\n    }\n    async registerSystem(system) {\n        this.systems.push(system);\n        await Promise.all(this.rooms.filter((room) => system.supportsRoom(room))\n            .map((room) => room.attachSystem(system)));\n    }\n    async getRoom(id) {\n        const room = this.rooms.find((r) => r.id === id);\n        if (!room) {\n            console.log(`Room ${id} not found. Creating.`);\n            const newRoom = new Room_1.default(id, this.io);\n            const supportedSystems = this.systems.filter((system) => system.supportsRoom(newRoom));\n            await Promise.all(supportedSystems.map((system) => newRoom.attachSystem(system)));\n            console.log(`System ${supportedSystems.map((system) => system.id()).join(', ')} attached to room ${id}`);\n            this.rooms.push(newRoom);\n            return newRoom;\n        }\n        return room;\n    }\n    start() {\n        if (this.started) {\n            throw new Error('Server already started');\n        }\n        this.started = true;\n        this.io.on('connection', async (socket) => {\n            const { token } = socket.handshake.query;\n            if (!token) {\n                socket.disconnect();\n                return;\n            }\n            socket.on('disconnect', async () => {\n                const client = this.clients[socket.id];\n                if (client) {\n                    await Promise.all(this.rooms.map((room) => room.removeClient(client)));\n                    client.destroy();\n                    delete this.clients[socket.id];\n                }\n                console.log(`Client ${socket.id} disconnected`);\n            });\n            try {\n                const user = await this.auth.authenticate(token);\n                const client = new Client_1.default(socket, user);\n                this.clients[socket.id] = client;\n                console.log(`Client ${socket.id} authenticated as ${client.user.id}`);\n            }\n            catch (e) {\n                console.error(e);\n                socket.disconnect();\n                return;\n            }\n            socket.on('join-room', async ({ roomId }, callback) => {\n                const client = this.clients[socket.id];\n                const room = await this.getRoom(roomId);\n                const response = await room.addClient(client);\n                if (typeof callback === 'function') {\n                    callback(response);\n                }\n            });\n            socket.on('leave-room', async ({ roomId }, callback) => {\n                const client = this.clients[socket.id];\n                const room = await this.getRoom(roomId);\n                const response = await room.removeClient(client);\n                if (typeof callback === 'function') {\n                    callback(response);\n                }\n            });\n            socket.emit('connection-ready');\n        });\n    }\n}\nexports.default = Server;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/Server.ts?");

/***/ }),

/***/ "./src/auth/SimpleAuth.ts":
/*!********************************!*\
  !*** ./src/auth/SimpleAuth.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst axios_1 = __webpack_require__(/*! axios */ \"axios\");\nconst User_1 = __webpack_require__(/*! ../client/User */ \"./src/client/User.ts\");\nclass SimpleAuth {\n    baseUrl;\n    constructor(baseUrl) {\n        this.baseUrl = baseUrl;\n    }\n    async authenticate(token) {\n        const connectedUser = await axios_1.default.get(`${this.baseUrl}/api/user-from-token?token=${token}`)\n            .then((response) => response.data)\n            .then((data) => data.data);\n        return new User_1.default(connectedUser.id);\n    }\n}\nexports.default = SimpleAuth;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/auth/SimpleAuth.ts?");

/***/ }),

/***/ "./src/client/Client.ts":
/*!******************************!*\
  !*** ./src/client/Client.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nclass Client {\n    socket;\n    user;\n    constructor(socket, user) {\n        this.socket = socket;\n        this.user = user;\n        user.addClient(this);\n    }\n    destroy() {\n        this.user.removeClient(this);\n    }\n}\nexports.default = Client;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/client/Client.ts?");

/***/ }),

/***/ "./src/client/User.ts":
/*!****************************!*\
  !*** ./src/client/User.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nclass User {\n    id;\n    clients = [];\n    constructor(id) {\n        this.id = id;\n    }\n    addClient(client) {\n        this.clients.push(client);\n    }\n    removeClient(client) {\n        this.clients = this.clients.filter((c) => c.socket.id === client.socket.id);\n    }\n    equals(user) {\n        return this.id === user.id;\n    }\n}\nexports.default = User;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/client/User.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst http_1 = __webpack_require__(/*! http */ \"http\");\nconst socket_io_1 = __webpack_require__(/*! socket.io */ \"socket.io\");\nconst Server_1 = __webpack_require__(/*! ./Server */ \"./src/Server.ts\");\nconst SimpleAuth_1 = __webpack_require__(/*! ./auth/SimpleAuth */ \"./src/auth/SimpleAuth.ts\");\nconst Chat_1 = __webpack_require__(/*! ./systems/Chat */ \"./src/systems/Chat.ts\");\nconst httpServer = http_1.createServer();\nconst io = new socket_io_1.Server(httpServer, {\n    cors: {\n        origin: 'http://localhost',\n        methods: ['GET', 'POST'],\n    },\n});\nconst server = new Server_1.default(io, new SimpleAuth_1.default('http://localhost'));\nserver.registerSystem(new Chat_1.default('http://localhost/api'));\nserver.start();\nhttpServer.listen(3000, () => {\n    console.log('listening on *:3000');\n});\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/index.ts?");

/***/ }),

/***/ "./src/room/Room.ts":
/*!**************************!*\
  !*** ./src/room/Room.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nclass Room {\n    id;\n    io;\n    clients = [];\n    systems = [];\n    listeners = {\n        newUserJoined: [],\n        userLeft: [],\n    };\n    constructor(id, io) {\n        this.id = id;\n        this.io = io;\n    }\n    async addClient(client) {\n        if (this.isClientInRoom(client)) {\n            return {};\n        }\n        const usersBeforeJoin = this.getUsers();\n        client.socket.join(this.id);\n        this.clients.push(client);\n        if (usersBeforeJoin.length !== this.getUsers().length) {\n            this.listeners.newUserJoined.forEach((listener) => listener(client.user));\n        }\n        const keys = this.systems.map((system) => system.id());\n        const promisses = this.systems.map((system) => system.onClientJoined(this, client));\n        const values = await Promise.all(promisses);\n        const result = {};\n        keys.forEach((key, index) => {\n            result[key] = values[index];\n        });\n        this.systems.forEach((system) => {\n            system.getEvents(this, client).forEach((event) => {\n                client.socket.on(`${this.id}/${event.name}`, event.handler);\n            });\n        });\n        console.log(`Client ${client.socket.id} joined room ${this.id}`);\n        return result;\n    }\n    async attachSystem(system) {\n        this.systems.push(system);\n        await system.onAttach(this);\n        this.clients.forEach((client) => {\n            system.onClientJoined(this, client);\n        });\n    }\n    async removeClient(client) {\n        if (!this.isClientInRoom(client)) {\n            return {};\n        }\n        this.systems.forEach((system) => {\n            system.getEvents(this, client).forEach((event) => {\n                client.socket.removeAllListeners(`${this.id}/${event.name}`);\n            });\n        });\n        const usersBeforeLeave = this.getUsers();\n        console.log('before', this.clients.map((c) => c.socket.id));\n        this.clients = this.clients.filter((c) => c.socket.id !== client.socket.id);\n        console.log('after', this.clients.map((c) => c.socket.id));\n        client.socket.leave(this.id);\n        if (usersBeforeLeave.length !== this.getUsers().length) {\n            this.listeners.userLeft.forEach((listener) => listener(client.user));\n        }\n        const keys = this.systems.map((system) => system.id());\n        const promisses = this.systems.map((system) => system.onClientLeft(this, client));\n        const values = await Promise.all(promisses);\n        const result = {};\n        keys.forEach((key, index) => {\n            result[key] = values[index];\n        });\n        console.log(`Client ${client.socket.id} left room ${this.id}`);\n        return result;\n    }\n    isClientInRoom(client) {\n        return !!this.clients.find((m) => m.socket.id === client.socket.id);\n    }\n    getUsers() {\n        const users = [];\n        this.clients.forEach((c) => {\n            const user = users.find((u) => u.equals(c.user));\n            if (!user) {\n                users.push(c.user);\n            }\n        });\n        return users;\n    }\n    getUserIds() {\n        return this.getUsers().map((user) => user.id);\n    }\n    emit(eventName, ...args) {\n        this.io.to(this.id).emit(`${this.id}/${eventName}`, ...args);\n    }\n    addListener(name, listener) {\n        this.listeners[name].push(listener);\n    }\n}\nexports.default = Room;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/room/Room.ts?");

/***/ }),

/***/ "./src/systems/Chat.ts":
/*!*****************************!*\
  !*** ./src/systems/Chat.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst lodash_1 = __webpack_require__(/*! lodash */ \"lodash\");\nconst Api = __webpack_require__(/*! ../Api */ \"./src/Api.ts\");\nclass Chat {\n    apiUrl;\n    messages = {};\n    messageQueue = [];\n    constructor(apiUrl) {\n        this.apiUrl = apiUrl;\n    }\n    getEvents(room, client) {\n        return [\n            {\n                name: 'message',\n                handler: ({ content, id }) => {\n                    const author = client.user.id;\n                    const date = Date.now();\n                    const message = {\n                        content, id, author, date, room: room.id,\n                    };\n                    this.messages[room.id].push(message);\n                    this.saveMessage(message);\n                    room.emit('message', message);\n                },\n            },\n        ];\n    }\n    async onAttach(room) {\n        room.addListener('newUserJoined', () => {\n            room.emit('user-list', room.getUserIds());\n        });\n        room.addListener('userLeft', () => {\n            room.emit('user-list', room.getUserIds());\n        });\n        this.loadMessages(room);\n    }\n    id() {\n        return 'chat';\n    }\n    supportsRoom(room) {\n        return /^chat\\//.test(room.id);\n    }\n    async onClientJoined(room) {\n        return {\n            users: room.getUserIds(),\n            messages: this.messages[room.id] || [],\n        };\n    }\n    async onClientLeft() { }\n    async loadMessages(room) {\n        try {\n            this.messages[room.id] = await Api.get(`${this.apiUrl}/chat/messages?room=${room.id}`) || [];\n        }\n        catch (e) {\n            this.messages[room.id] = [];\n        }\n    }\n    saveMessage(message) {\n        this.messageQueue.push(message);\n        this.flushQueue();\n    }\n    flushQueue = lodash_1.debounce(async () => {\n        const data = JSON.parse(JSON.stringify(this.messageQueue));\n        this.messageQueue = [];\n        if (data.length === 0) {\n            return;\n        }\n        try {\n            await Api.post(`${this.apiUrl}/chat/messages`, data);\n        }\n        catch (e) {\n            this.messageQueue = [...data, ...this.messageQueue];\n        }\n    }, 1000);\n}\nexports.default = Chat;\n\n\n//# sourceURL=webpack://bear-it-chat-server/./src/systems/Chat.ts?");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

module.exports = require("axios");;

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");;

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("lodash");;

/***/ }),

/***/ "socket.io":
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("socket.io");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;