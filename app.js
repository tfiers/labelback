'use strict'

const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const express = require('express')
const request = require('request-promise')

const port = (process.env.PORT || 3000)
const mongoURI = (process.env.MONGODB_URI ||
                  fs.readFileSync('mongodb_URI', 'utf8'))
const slackSecret = (process.env.SLACK_SECRET ||
                     fs.readFileSync('slack_secret', 'utf8'))

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
      label: null,
    }))
)

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
        state = { events: generateEvents(tup[0], tup[1] + 1) }
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

app.get('/slack', (req, res) => {
  request.get({
    url: 'https://slack.com/api/oauth.access',
    qs: {
      client_id: '3796102131.339930271830',
      client_secret: slackSecret,
      code: req.query.code,
    },
  })
  .then((data) => {
    let access_token = JSON.parse(data).access_token
    res.redirect(`/app.html?token=${access_token}`)
  })
})

app.use(express.static('../labelface'))

app.listen(port, 
    () => console.log(`Labelback app running on ${port}`)
)
