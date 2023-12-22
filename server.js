const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = require('http').Server(app);
const io = socketIO(server);
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb+srv://user:userpassword@cluster0.tei2s5c.mongodb.net/?retryWrites=true&w=majority');
const connection = mongoose.connection;

connection.once('open', () => {
  console.log('Подключено к базе данных');
});

const drawingSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  prevX: Number,
  prevY: Number,
  color: String,
  lineWidth: Number,
  type: String, 
  text: String, 
  id: String,
});

const boardSchema = new mongoose.Schema({
  name: String,
  data: {
    drawings: [drawingSchema],
  },
  imgPath: String,
});
const Board = mongoose.model('Board', boardSchema);


app.get('/', (req, res) => {
  res.sendFile('/index.html');
});

app.post('/login', async (req, res) => {
  const { username } = req.body;
  try {
    const boards = await Board.find();
    let boardsData = boards.reduce((acc, board) => {
      acc[board._id] = board.data.drawings;
      return acc;
    }, {});
    boardsData = encodeURIComponent(JSON.stringify(boardsData));
    res.render('inner-page.ejs', { username, boards, boardsData });
  } catch (error) {
    console.error('Ошибка при получении списка досок:', error);
    res.status(500).send('Internal Server Error');
  }
});

io.on('connection', (socket) => {
  const boardId = socket.handshake.query.boardId;

  socket.on('joinBoard', (requestedBoardId) => {
    socket.join(requestedBoardId);
    console.log(`User joined board ${requestedBoardId}`);
  });

  socket.on('draw', async (data) => {
    const { x, y, prevX, prevY, color, lineWidth, type, text, id } = data;
    try {
      const board = await Board.findById(boardId);
      if (!board) {
        console.error('Доска не найдена');
        return;
      }
      board.data.drawings.push({ x, y, prevX, prevY, color, lineWidth, type, text, id });
      await board.save();
      io.to(boardId).emit('draw', data);
    } catch (error) {
      console.error('Ошибка при сохранении рисунка в базу данных:', error);
    }
  });

  socket.on('delete', async (data) => {
    const { objectId } = data;
    try {
      const board = await Board.findById(boardId);
      if (!board) {
        console.error('Доска не найдена');
        return;
      }

      board.data.drawings = board.data.drawings.filter((drawing) => drawing.id !== objectId);
      await board.save();
      io.to(boardId).emit('delete', data);
    } catch (error) {
      console.error('Ошибка при удалении объекта из базы данных:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Доска не найдена' });
    }
    const drawings = encodeURIComponent(JSON.stringify(board.data.drawings));
    return res.render('board.ejs', { board, drawings });
  } catch (error) {
    console.error('Ошибка при получении рисунков из базы данных:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});


app.post('/createBoard', async (req, res) => {
  try {
    const boardName  = req.body.boardname;
    const newBoard = new Board({ name: boardName });;
    await newBoard.save();
    res.redirect(`/boards/${newBoard._id}`);
  } catch (error) {
    console.error('Ошибка при создании доски:', error);
    res.status(500).send('Internal Server Error');
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
