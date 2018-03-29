const express = require('express')
const app = express()

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

port = 3000
app.listen(port, 
    () => console.log(`Labelback app running on ${port}`)
)
