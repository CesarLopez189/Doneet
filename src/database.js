const mongoose = require('mongoose');

const MONGODB_URII = 'mongodb+srv://root:1234@doneetdb.mqouaag.mongodb.net/test';

mongoose.connect(MONGODB_URII, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
    .then(db => console.log('Database is connected'))
    .catch(err => console.log(err));