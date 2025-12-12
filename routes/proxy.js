'use strict'

const { Router } = require('express')
const { Readable } = require('stream')

const router = Router()

router.get('/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url)
  const ext = req.query.ext || 'webm'
  let filename = decodeURIComponent(req.query.f || 'video')

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // We need to clean the filename to prevent HTTP errors like "Invalid character in header content"
      filename = filename.replace(/[^a-zA-Z0-9-_. ]/g, '_')

      // Set headers
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.${ext}`)

      // Copy relevant headers from the source
      if (response.headers.get('content-type')) {
        res.setHeader('Content-Type', response.headers.get('content-type'))
      }
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'))
      }

      // Convert web ReadableStream to Node.js readable stream and pipe to response
      const nodeStream = Readable.fromWeb(response.body)
      nodeStream.pipe(res)
    })
    .catch(err => {
      console.error(err.message)

      res.status(500).send({ message: 'Failed to proxy video' })
    })
})

module.exports = router
