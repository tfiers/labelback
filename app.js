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
      'unlabelled': generateEvents(50),
      'not_SWR': [],
      'SWR': [],
      'activeEvent': null,
    },
})

let mongoExec = (fun) => {
  let client
  MongoClient.connect(mongoURI)
  .then((c) => {
    client = c
    const db = client.db(client.s.options.dbName)
    const col = db.collection(collectionName)
    return fun(col)
  })
  .catch(console.log)
  .then(() => client.close())
}


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
  mongoExec((collection) => (
    collection.findOne({name: 'dummy'})
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
  ))
})


app.post('/save', (req, res) => {
  mongoExec((collection) => (
    collection.replaceOne(
          {name: 'dummy'},
          {name: 'dummy', state: req.body},
          {upsert: true}
    )
    .then(() => {
      res.end()
      console.log('Upserted state')
    })
  ))
})

app.listen(port, 
    () => console.log(`Labelback app running on ${port}`)
)
