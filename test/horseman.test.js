const fs = require('fs')
const path = require('path')
const assert = require('assert')
const Horseman = require('../index')

describe('horseman', function () {

  describe('server', function () {
    it('creates a server on a default port', async function () {
      const horseman = new Horseman()
      await horseman.getBrowser()

      assert.ok(/\:3000$/.test(horseman.server._connectionKey))

      await horseman.closeBrowser()
    })

    it('creates a server on a specified port', async function () {
      const horseman = new Horseman({ port: 3001 })
      await horseman.getBrowser()

      assert.ok(/\:3001$/.test(horseman.server._connectionKey))

      await horseman.closeBrowser()
    })
  })

  describe('browser', function () {
    it('avoids creating redundant browsers instances', async function () {
      const horseman = new Horseman()
      const browserInstances = await Promise.all([horseman.getBrowser(), horseman.getBrowser()])

      assert.equal(browserInstances[0], browserInstances[1])

      await horseman.closeBrowser()
    })
  })

  describe('pages', function () {

    before(function () {
      this.testTemplate = fs.readFileSync(path.resolve(__dirname, './templates/test-template.html'))
      this.testTemplate2 = fs.readFileSync(path.resolve(__dirname, './templates/test-template-2.html'))
      this.testResource = fs.readFileSync(path.resolve(__dirname, './templates/test-resource.js'))

      this.port = 3000
      this.port2 = 3001
      this.routes = [
        {
          test: /test-resource\.js$/,
          file: this.testResource,
        },
        {
          test: /test-template-2\.html$/,
          file: this.testTemplate2,
        },
        {
          test: null,
          file: this.testTemplate,
        }
      ]

      this.horseman = new Horseman({
        port: this.port,
        routes: this.routes,
      })
    })

    after(async function () {
      await this.horseman.closeBrowser()
    })

    it('navigates to a page', async function () {
      const page = await this.horseman.getPage()
      const result = await page.evaluate(() => !!document.querySelector('#test-div'))

      assert.ok(result)

      await page.close()
    })

    it('serves a resource to the page', async function () {
      const page = await this.horseman.getPage()
      const result = await page.evaluate(() => window.HORSEMAN_TEST_VAR)

      assert.equal(result, 'HORSEMAN_TEST_VAR')

      await page.close()
    })

    it('navigates to a specified path', async function () {
      const page = await this.horseman.getPage({ path: '/test-template-2.html' })
      const result = await page.evaluate(() => !!document.querySelector('#test-div-2'))

      assert.ok(result)

      await page.close()
    })
  })


})
