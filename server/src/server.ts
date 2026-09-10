import {app} from './app.js';
import {connectDb} from './config/db.js';
import {env} from './config/env.js';connectDb().then(()=>app.listen(env.port,'0.0.0.0',()=>console.log(`API listening on http://0.0.0.0:${env.port}`))).catch(err=>{console.error(err);process.exit(1)});
