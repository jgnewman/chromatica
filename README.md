# horseman

> A small wrapper for puppeteer to enable even faster headless chrome testing

This is a small, personal project I put together to help me get basic browser testing enabled a lot more quickly and with a whole lot less boilerplate. Essentially it's just a class that puts a layer of abstraction over puppeteer and incorporates a simple http server automatically.

## Here's how it works

First, figure out what testing framework you want to use. In this case, we'll assume we're using mocha.

Next, you'll need to make sure you have at least one HTML template you can use to serve up to headless chrome. If you are testing a website, chances are you'll have a lot of these already. If you're testing pure javascript (for example, if you're building a DOM manipulation library or something), you may need to create a template. Here's an example:

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>Test</title>
  </head>
  <body>
    <div id="foo"></div>
    <script src="/path/to/my-test-code.js"></script>
  </body>
</html>
```

Inside one of your actual test files, import horseman and get your configuration options ready. What we're doing here is configuring the horseman server to serve up the right files when it gets requests from chrome.

```javascript
const fs = require('fs')
const assert = require('assert')
const Horseman = require('horseman')

const serverPort = 3000 // or whatever you want. Default is 3000
const serverRoutes = [
  {
    test: /my-test-code\.js$/,
    file: fs.readFileSync('/path/to/my-test-code.js')
  },
  {
    test: null,
    file: fs.readFileSync('/path/to/my-test-html-template.html')
  }
]
```

In this example, when headless chrome attempts to navigate to `/`, it'll match the null test (which is a catch-all) and it'll be sent our HTML template. When it loads up that file and makes a request for `/path/to/my-test-code.js`, the request will match our other regex test and the server will hand over the JS file.

**Now it's time to start writing tests.**

The simplest way to get things running is to "turn on" horseman at the beginning of a set of tests and then "turn it back off" when the tests are through. In that case, we can write something like this:

```javascript
describe('some tests', function () {

  before(async function () {
    this.horseman = new Horseman({
      port: serverPort,
      routes: serverRoutes
    })
    this.page = await this.horseman.getPage()
  })

  after(async function () {
    await this.page.close()
    await this.horseman.closeBrowser()
  })

  it('loads the html template', async function () {
    const result = await this.page.evaluate(() => !!document.querySelector('#foo'))
    assert.ok(result)
  })

})
```

Here we see nearly all of horseman's functionality at work. Creating a `new Horseman` spins up a server that's ready to work with headless chrome. Calling `getPage` opens the browser if it isn't already open and returns a new page via puppeteer. Calling `closeBrowser` closes all open pages, shuts down headless chrome, and shuts down the server it was talking to.

Once you have a page object, you're dealing with the raw object produced by puppeteer so if you want to know what methods it has available to it, check out the puppeteer docs. Most of the time, you'll just want to evaluate something on the page. If you want to configure the page (specifying, for instance, whether or not to wait until the network is idle, etc), you can pass in an object of puppeteer page options to `getPage`. For example:

```javascript
this.horseman.getPage({
  waitUntil: 'networkidle0'
})
```

By default, when you call `getPage`, horseman will navigation your page to `http://localhost:<YOUR_PORT_NUMBER>`, assuming that you have provided a `null` route that serves up an HTML template. If you would like to change this, just add a `path` field to your options object:

```javascript
this.horseman.getPage({
  waitUntil: 'networkidle0',
  path: '/my-page.html'
})
```
