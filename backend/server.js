const mongoose = require("mongoose");
const Document = require("./models/Document.js");
const cors = require("cors");

const express = require('express');
const http = require("http");
const socketIO = require('socket.io');

const AuthRouter = require("./middleware/Authentication.js");
const UserRouter = require("./middleware/Profile.js");

const app = express();
app.use(express.json())
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

mongoose.connect("mongodb+srv://piyush09:qTMy38x22hXofIyI@cluster0.1bqc8.mongodb.net/?retryWrites=true&w=majority")
    .then(() => {
        console.log("DB connected");
    });

app.use(cors());
app.use(AuthRouter);
app.use(UserRouter)


io.on("connection", (socket) => {
    socket.on("get-doc", async docId => {
        const document = await findOrCreateDoc(docId);
        console.log(document.data);

        socket.join(docId);
        socket.emit("load-doc", document.data);

        socket.on("text-changes", (delta) => {
            socket.broadcast.to(docId).emit("recieve-changes", delta);
        });

        socket.on("save-doc", async data => {
            await Document.findOneAndUpdate({ _id: docId }, { data });
        });
    });
});

async function findOrCreateDoc(id) {
    if (id == null) return;

    const document = await Document.findById(id);

    if (document) return document;

    return await Document.create({ _id: id, data: "" });
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`App Listening on port ${PORT}`);
});
