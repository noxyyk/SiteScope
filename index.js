const cheerio = require("cheerio")
const { MessageEmbed } = require("discord.js")
const express = require("express")
const app = express()
const port = 5000
FileSystem = require("fs")
if (process.env.NODE_ENV !== "production") require("dotenv").config()
const interval = 1000 * 60 * 30
const delay = (ms) => new Promise((res) => setTimeout(res, ms))
var websites = require("./websites.json").website
const webhookUrl = process.env.WEBHOOK_URL
async function checkForChanges() {
    const allowedTime = [0, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20]
    const date = new Date()
    if (!allowedTime.includes(date.getHours())) return console.log("Not allowed time", date.getHours())
    var changes = []
    try {
    const fetch = await import("node-fetch")
    for (let i = 0; i < websites.length; i++) {
        const {url,previousTitle,titleSelector,imageSelector,hrefSelector,requestOptions,authorSelector,contentSelector,color,extras,text,link,contentSelector2,} = websites[i]
        var title, content, image, href, author
        const websiteData = await (await fetch.default(url)).text()
        const $ = cheerio.load(websiteData)
        var embed = new MessageEmbed()
        switch (extras.SELECTOR) {
            case "content":
                if ($(contentSelector).first().text() === previousTitle) continue
                title = $(titleSelector).first().text()
                image = imageSelector
                    ? (link +
                      $(imageSelector).first().attr("src"))
                    : null
                var hrefs = []
                var contents = []
                var contents2 = []

                $(hrefSelector).each((index, element) => {hrefs.push($(element).attr("href"))})
                $(contentSelector).each((index, element) => {contents.push($(element).text())})
                $(contentSelector2).each((index, element) => {contents2.push($(element).text())})
                let fields = []
                for (let i = 0; i < Math.min(contents.length, 11); i++) {
                    fields.push({
                        name: contents[i],
                        value: "[" + contents2[i] + "](" + hrefs[i] + ")",
                        inline: true,
                    })
                }
                embed.addFields(fields)
                websites[i].previousTitle = contents[0]
                break
            case "title":
                title = $(titleSelector).first().text()
                if (title === previousTitle) continue
                href = link + $(hrefSelector).first().attr("href")
                content = $(contentSelector).first().text()
                try {image = imageSelector ? (link + $(imageSelector).first().attr("src")) : null} catch (error) {console.log(error)}    
                websites[i].previousTitle = title
                break
            default:
                console.log("404", url)
                break
        }

        if (extras) {
            if (extras.authorSelector)
                author = $(extras.authorSelector).first().text()
        }

        embed.setTimestamp()
        if (title) embed.setTitle(title)
        embed.setURL(href ? href : url)
        if (color) embed.setColor(color)
        if (content) embed.setDescription(content)
        if (image) embed.setThumbnail(image)
        if (author) embed.setAuthor(extras.obvody[String(author.slice(-1))])
        await fetch.default(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                embeds: [embed.toJSON()],
                content:
                    text +
                    " " +
                    (author
                        ? `<@&${extras.role_obvod[author.slice(-1)]}>`
                        : ""),
            }),
        })
        title += title + "\n"
        changes.push(title)
        let data = FileSystem.readFileSync("./websites.json")
        data = JSON.parse(data)
        data.website[i].previousTitle = websites[i].previousTitle
        data = JSON.stringify(data)
        FileSystem.writeFileSync("./websites.json", data)

    }
    } catch (error) {
        console.log(error)
    }
    if (changes.length > 0) {
        console.log(changes.length + " changes found!", changes.join("\n"))
    } else {
        console.log("No changes found!")
    }
}
app.get("/", (req, res) => res.send("Website monitor is running!"))
app.listen(port, () => console.log(`Website monitor is running! ${port}!`))
setInterval(checkForChanges, interval);
checkForChanges()
