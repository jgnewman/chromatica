const puppeteer = require('puppeteer')
const http = require('http')
require('http-shutdown').extend()

function createBasicServer(routes, port) {
  const reqHandler = (req, res) => {
    let didEnd = false
    routes.some(route => {
      if (!route.test || route.test.test(req.url)) {
        res.writeHead(200)
        res.end(route.file)
        return (didEnd = true)
      }
      return false
    })
    if (!didEnd) {
      res.writeHead(404)
      res.end('Not Found')
    }
  }

  const server = http.createServer(reqHandler).withShutdown()
  server.listen(port)
  return server
}

async function getRawPage(horseman) {
  const browser = await horseman.getBrowser()
  const page = await browser.newPage()
  return page
}

class Horseman {

  constructor(options={}) {
    this.browser = null
    this.server = null
    this.port = options.port || 3000
    this.routes = options.routes || []
  }

  async getBrowser() {
    let browser

    if (!this.server) {
      this.server = createBasicServer(this.routes, this.port)
    }

    if (!this.browser) {
      browser = await puppeteer.launch()
    }

    // If we had a race condition on two processes creating a browser,
    // close the one we don't need
    if (browser && this.browser) {
      await browser.close()

    // If this was the first process to finish, set the browser
    } else if (!this.browser) {
      this.browser = browser
    }

    return this.browser
  }

  async closeBrowser() {
    const browser = await this.getBrowser()
    const pages = await browser.pages()
    await Promise.all(pages.map(async page => await page.close()))
    await browser.close()
    this.server && this.server.shutdown()
    this.server = null
  }

  async getPage(options={}) {
    const defaultOptions = { waitUntil: `networkidle0` }
    const page = await getRawPage(this)
    const url = `http://localhost:${this.port}${options.path || ''}`
    await page.goto(url, { ...defaultOptions, ...options })
    return page
  }
}

module.exports = Horseman
