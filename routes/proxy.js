'use strict'

const { Router } = require('express')
const axios = require('axios')

const router = Router()

router.get('/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url)
  const ext = req.query.ext || 'webm'
  let filename = decodeURIComponent(req.query.f || 'video')

  axios.get(url, {
    responseType: 'stream'
  })
    .then((stream) => {
      // We need to clean the filename to prevent HTTP errors like "Invalid character in header content"
      filename = filename.replace(/[^a-zA-Z0-9-_. ]/g, '_')

      stream.headers['Content-Disposition'] = `attachment; filename=${filename}.${ext}`
      res.writeHead(stream.status, stream.headers)
      stream.data.pipe(res)
    })
    .catch(err => {
      console.error(err.message)

      res.status(500).send({ message: 'Failed to proxy video' })
    })
})

module.exports = router
