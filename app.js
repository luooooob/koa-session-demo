const Koa        = require('koa')
const Router     = require('koa-router')
const nunjucks   = require('nunjucks')
const mysql      = require('mysql')
const bodyParser = require('koa-bodyparser')

const pwGen      = require('./utils').pwGen
const pwCheck    = require('./utils').pwCheck

const app        = new Koa()
const router     = new Router()

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'passdemo'
})

app.keys = ['im a newer secret', 'i like turtle']

nunjucks.configure(__dirname + '/view', { 
  noCache: true
})


router
  .get('/', async (ctx, next) => {
    const username = ctx.cookies.get('username', { signed: true })
    const userinfo = ctx.cookies.get('userinfo', { signed: true })
    if(!username) {
      ctx.body = nunjucks.render('nologin.njk')
    } else {
      ctx.body = nunjucks.render('page.njk', {
        username: username,
        userinfo: userinfo
      })
    }
    await next()
  })
  .get('/register', async (ctx, next) => {
    ctx.body = nunjucks.render('register.njk')
    await next()
  })
  .post('/register', async (ctx, next) => {
    try {
      const username = ctx.request.body.username
      const userpass = pwGen(ctx.request.body.userpass)
      const userinfo = ctx.request.body.userinfo
      const statement = `INSERT INTO users (username, userpass, userinfo) VALUES ('${username}', '${userpass}', '${userinfo}')`
      await new Promise((resolve, reject) => {
        connection.query(statement, (err, row) => {
          err ? reject(err)
              : resolve(row)
        })
      })
      ctx.redirect('/login')
    } catch(err) {
      ctx.body = nunjucks.render('register.njk', { error: true })
    }
    const username = ctx.request.body.username
    const userpass = pwGen(ctx.request.body.userpass)
    const userinfo = ctx.request.body.userinfo
    console.log(userpass)
    const statement = `INSERT INTO users (username, userpass, userinfo) VALUES ('${username}', '${userpass}', '${userinfo}')`
    console.log(statement)
    connection.query(statement, (err, row) => {
      if(err) {
        ctx.body = 'register error!'
      } else {
        ctx.redirect('/login')
      }
    })
    await next()
  })
  .get('/login', async (ctx, next) => {
    ctx.body = nunjucks.render('login.njk')
    await next()
  })
  .post('/login', async (ctx, next) => {
    try {
      const username  = ctx.request.body.username
      const passInput = ctx.request.body.userpass
      const statement = `select * from users where username = '${username}'`
      const row       = await new Promise((resolve, reject) => {
        connection.query(statement, (err, row) => {
          err ? reject(err)
              : resolve(row)
        })
      })
      const passSaved = row[0].userpass
      const userinfo  = row[0].userinfo
      console.log(passSaved)
      if(pwCheck(passInput, passSaved)) {
        console.log("sss")
        ctx.body = nunjucks.render('nologin.njk')
        ctx.cookies.set('username', username, { maxAge: 846000, signed: true })
        ctx.cookies.set('userinfo', userinfo, { maxAge: 846000, signed: true })
        ctx.redirect('/')
      } else {
        throw new Error('login failed')
      }
    } catch(err) {
      ctx.body = nunjucks.render('login.njk', { error: true })
    }
  })
  .get('/logout', async (ctx, next) => {
    ctx.cookies.set('username', null)
    ctx.cookies.set('userinfo', null)
    ctx.redirect('/')
  })

app.use(bodyParser())

app.use(router.routes())
app.listen(3000)
