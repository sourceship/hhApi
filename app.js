import  express from 'express';
import ColorController from './src/Controllers/ColorController'

var cors = require('cors')
const app = express();

const port = process.env.PORT || 3200;

app.use(cors())
app.use(express.json());
app.use('/account', ColorController)



app.listen(port, () => {
    console.log(`running on port ${port}`);
})