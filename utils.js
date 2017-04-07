const crypto = require('crypto')

const sha1 = (data, encoding) => crypto.createHash('sha1').update(data).digest(encoding)
const md5  = (data, encoding) => crypto.createHash('md5').update(data).digest(encoding)
const rand = ()               => Math.floor(Math.random()*32768)

exports.pwGen = function pwGen(passInput) {
  const passInputMd5 = md5(passInput, 'hex') // :String
  let salt = Buffer.alloc(4)
  Buffer
    .from(sha1(rand().toString(), 'hex')) // :Buffer
    .copy(salt, 0, 0, 4)
  const result = Buffer.concat([
    sha1(passInputMd5 + salt.toString('utf8')), salt
  ]).toString('base64')
  return result
}

exports.pwCheck = function pwCheck(passInput, passSaved) {
  const passInputMd5 = md5(passInput, 'hex') // :String
  let salt = Buffer.alloc(4)
  Buffer
    .from(passSaved, 'base64')
    .copy(salt, 0, 20)
  const result = Buffer.concat([
    sha1(passInputMd5 + salt.toString('utf8')), salt
  ]).toString('base64')
  return result === passSaved
}