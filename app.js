'use strict'

const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const express = require('express')

const port = (process.env.PORT || 3000)
const mongoURI = (process.env.MONGODB_URI ||
                  fs.readFileSync('mongodb_URI', 'utf8'))

const collectionName = 'state_collection'

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

const app = express()

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers',
               'Origin, X-Requested-With, Content-Type, Accept');
    next()
})

// To parse JSON-encoded bodies
app.use(express.json())

app.get('/fetch', (req, res) => {
  MongoClient.connect(mongoURI)
  .then((client) => {
    const db = client.db(client.s.options.dbName)
    const col = db.collection(collectionName)
    return col.findOne({name: 'dummy'})
  })
  .then((result) => {
    let state
    if (result == null) {
      state = generateNewState()
      console.log('Generated new state')
    }
    else {
      state = result.state
      console.log('Read existing state')
    }
    res.json(state)
  })
  .catch(console.log)
})

app.post('/save', (req, res) => {
  res.end()
  MongoClient.connect(mongoURI)
  .then((client) => {
    const db = client.db(client.s.options.dbName)
    const col = db.collection(collectionName)
    return col.replaceOne(
      {name: 'dummy'},
      {name: 'dummy', state: req.body},
      {upsert: true})
  })
  .catch(console.log)
  .then(() => {
    console.log('Upserted state')
  })
})

app.listen(port, 
    () => console.log(`Labelback app running on ${port}`)
)
