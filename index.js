import express from 'express'
import cors from 'cors'
import { nanoid } from 'nanoid';
import { Low, JSONFile } from 'lowdb';
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';
const app = express()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Low(new JSONFile("db.json"));
await db.read();
db.data ||= { users: [], exercises: [] };
await db.write();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


await db.read(); 

db.data ||= { users: [], exercises: [] };
db.data.users ||= [];
db.data.exercises ||= [];
await db.write(); 

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const _id = nanoid(12);
  db.data.users.push({ username, _id });
  await db.write();
  res.json({ username, _id });
});

app.get("/api/users", (req, res) => {
  res.json(db.data.users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const _id = req.params._id;
  const user = db.data.users.find(u => u._id === _id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const exercise = {
    _id,
    username: user.username,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  db.data.exercises.push(exercise);
  await db.write();

  res.json(exercise);
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const { _id } = req.params;
  const user = db.data.users.find(u => u._id === _id);
  if (!user) return res.status(404).json({ error: "User not found" });

  let logs = db.data.exercises.filter(e => e._id === _id);

  if (from) {
    const fromDate = new Date(from);
    logs = logs.filter(e => new Date(e.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    logs = logs.filter(e => new Date(e.date) <= toDate);
  }

  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))
  });
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
