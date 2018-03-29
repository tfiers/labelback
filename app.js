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

app.get('/', (req, res) => res.json(generateNewState()))

port = 3000
app.listen(port, 
	() => console.log(`Labelback app running on ${port}`)
)
