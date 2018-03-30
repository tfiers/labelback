const MongoClient = require('mongodb').MongoClient;
const express = require('express')
const app = express()

const port = (process.env.PORT || 3000)
const mongoURI = (process.env.MONGODB_URI ||
                  fs.readFileSync('mongodb_URI', 'utf8'))

let generateEvents = (num) => (
    Array(num).fill().map((v,i)=>({id: i}))
)

let generateNewState = () => ({
    'events': {
      'unlabelled': generateEvents(1000),
      'not_SWR': [],
      'SWR': [],
      'activeEvent': null,
    },
})

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers',
               'Origin, X-Requested-With, Content-Type, Accept');
    next()
})

app.get('/', (req, res) => res.json(generateNewState()))

app.listen(port, 
    () => console.log(`Labelback app running on ${port}`)
)
