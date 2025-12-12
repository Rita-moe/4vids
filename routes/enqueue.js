'use strict'

const fs = require('fs-extra')
const path = require('path')
const { Router } = require('express')
const download = require('download')
const listVideos = require('4chan-list-videos')
const Bottleneck = require('bottleneck')

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000
})
const router = Router()
const throttledListVideos = limiter.wrap(listVideos)

async function downloadThumbnails (dir, urls) {
  await fs.ensureDir(dir)

  const thumbnails = await fs.readdir(dir)
  const thumbnailsToDownload = urls.length - thumbnails.length

  if (thumbnailsToDownload === 0) {
    console.log('Images cached! No thumbnails downloaded')
  } else {
    const downloadPromises = urls
      .slice(-thumbnailsToDownload)
      .map(x => download(x, dir))

    await Promise.all(downloadPromises)

    console.log(`${urls.length} thumbnails downloaded!`)
  }
}

router.get('/:board/thread/:threadNo', async (req, res) => {
  const reg = /https:\/\/i\.4cdn\.org\/(.*)\/(.*)/g
  const { board, threadNo } = req.params
  const dir = path.join(__dirname, `../thumbnail/${board}/${threadNo}`)

  let listJson
  let resJson = {
    videos: []
  }
  let thumbnailJson

  try {
    listJson = await throttledListVideos(board, threadNo, { https: true })
    thumbnailJson = [
      ...listJson.mp4s.map(mp4 => mp4.thumbnail),
      ...listJson.webms.map(webm => webm.thumbnail)
    ]
  } catch (err) {
    res.status(404).send(err.message)

    return
  }

  try {
    await downloadThumbnails(dir, thumbnailJson)
  } catch (err) {
    console.error(`Failed to download thumbnails: ${err}`)
  }

  listJson.webms.forEach((webm) => {
    webm.url = `/proxy/${encodeURIComponent(webm.url)}?ext=webm&f=${encodeURIComponent(webm.filename)}`
    webm.thumbnail = webm.thumbnail.replace(reg, `/thumbnail/${board}/${threadNo}/$2`)
    webm.filename = `${webm.filename}.webm`
    resJson.videos.push(webm)
  })

  listJson.mp4s.forEach((mp4) => {
    mp4.url = `/proxy/${encodeURIComponent(mp4.url)}?ext=mp4&f=${encodeURIComponent(mp4.filename)}`
    mp4.thumbnail = mp4.thumbnail.replace(reg, `/thumbnail/${board}/${threadNo}/$2`)
    mp4.filename = `${mp4.filename}.mp4`
    resJson.videos.push(mp4)
  })

  if (listJson.subject) {
    resJson.subject = listJson.subject
  }

  res.json(resJson)
})

module.exports = router
