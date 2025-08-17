/**
 * Docker健康检查脚本
 * @description 检查应用是否正常运行
 */

const http = require('http')

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
}

const healthcheck = () => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve('Health check passed')
      } else {
        reject(`Health check failed with status: ${res.statusCode}`)
      }
    })

    req.on('error', (err) => {
      reject(`Health check failed: ${err.message}`)
    })

    req.on('timeout', () => {
      req.destroy()
      reject('Health check timeout')
    })

    req.end()
  })
}

// 执行健康检查
healthcheck()
  .then(() => {
    console.log('✅ Health check passed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Health check failed:', error)
    process.exit(1)
  })

