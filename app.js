'use strict'

const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const express = require('express')

const port = (process.env.PORT || 3000)
const mongoURI = (process.env.MONGODB_URI ||
                  fs.readFileSync('mongodb_URI', 'utf8'))

const collectionName = 'state_collection'
const tupleSep = ' - '

const tupleToStr = (tuple) => (
  (tuple[0]+1) + tupleSep + (tuple[1]+1)
)

const strToTuple = (str) => (
  str.split(tupleSep).map((s) => parseInt(s) - 1)
)

// Stops at 'stop - 1'
const generateEvents = (start, stop) => (
    Array(stop - start).fill().map((v,i) => ({
      id: start + i,
    }))
)

const generateNewState = (start, stop) => ({
    'events': {
      'unlabelled': generateEvents(start, stop),
      'not_SWR': [],
      'SWR': [],
      'activeEvent': null,
    },
})

const mongoExec = (fun) => {
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

app.get('/subsets', (req, res) => {
  mongoExec((collection) => (
    collection.findOne({key: 'subsets'})
    .then((result) => {
      res.json(result.value.map(tupleToStr))
    })
  ))
})

app.get('/state', (req, res) => {
  const tup = strToTuple(req.query.subset)
  mongoExec((collection) => (
    collection.findOne({
      author: req.query.author,
      subset: tup,
    })
    .then((result) => {
      let state
      if (result == null) {
        state = generateNewState(tup[0], tup[1] + 1)
        console.log('Generated new state')
      }
      else {
        state = { events: result.events }
        console.log('Read existing state')
      }
      res.json(state)
    })
  ))
})

app.post('/state', (req, res) => {
  mongoExec((collection) => (
    collection.replaceOne(
      {
        author: req.body.author,
        subset: strToTuple(req.body.subset),
      },
      {
        author: req.body.author,
        subset: strToTuple(req.body.subset),
        events: req.body.events,
      },
      {
        upsert: true
      }
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
