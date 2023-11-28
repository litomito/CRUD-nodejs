const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const path = require('path');
const multer = require('multer');
const sizeOf = require('image-size');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const defaultData = {
    users: [
        {
            id: 0,
            firstname: "",
            lastname: "",
            username: "",
            dateofbirth: "",
            image: "",
            profession: "",
        },
    ],
};

db.defaults(defaultData).write();

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/public/style', express.static(path.join(__dirname, 'public/style')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use('/public/html', express.static(path.join(__dirname, 'public/html')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get(['/', '/create'], (req, res) => {
    const users = db.get('users').value();
    res.render('create', { users: users });
});

app.get('/read', (req, res) => {
    const users = db.get('users').value();
    res.render('read', { users: users });
});

app.get('/update', (req, res) => {
    const userId = req.query.id;
    const user = db.get('users').find({ id: parseInt(userId) }).value();

    res.render('update', { 
        user: user, 
        image: user.image, 
        firstname: user.firstname, 
        lastname: user.lastname, 
        username: user.username, 
        dateofbirth: user.dateofbirth, 
        profession: user.profession 
    });
});

app.delete('/users/delete/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = db.get('users').findIndex({ id: userId }).value();

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    db.get('users').splice(userIndex, 1).write();
    res.json({ message: 'User deleted successfully' });
});


app.put('/users', (req, res) => {
    console.log(req.body)
});

app.post('/users', upload.single('image'), (req, res) => {
    console.log("POST - /users");
    console.log(req.body);

    const { firstname, lastname, username, dateofbirth, profession } = req.body;

    const lastUser = db.get('users').takeRight(1).value()[0];
    console.log(lastUser);
    const nextId = lastUser.id + 1;

    const image = req.file ? `/img/${req.file.filename}` : '';
    console.log(image)

    db.get('users').push({ 
        id: nextId, 
        firstname: firstname, 
        lastname: lastname, 
        username: username, 
        dateofbirth: dateofbirth, 
        image: image, 
        profession: profession 
    }).write();

    res.redirect('/read');
});

app.post('/users/update/:id', upload.single('image'), (req, res) => {
    const userId = parseInt(req.params.id);
    const user = db.get('users').find({ id: userId });

    if (!user.value()) {
        return res.status(404).send('User not found');
    }

    const { firstname, lastname, username, dateofbirth, profession } = req.body;

    const image = req.file ? `/img/${req.file.filename}` : user.get('image').value();

    user.assign({ firstname, lastname, username, dateofbirth, image, profession }).write();

    res.redirect('/read');
});


app.listen(3000, () => {
    console.log("Listening on 3000");
});