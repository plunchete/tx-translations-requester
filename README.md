Transifex Translations Requester
----

Transifex translations requester is a simple script written in Node.js to automatically request new translations on [Transifex](https://www.transifex.com/)



Requirements
----

* Node.js
* NPM (comes with Node)
* [Transifex configured in your local](http://docs.transifex.com/developer/client/setup#configuration)



Getting the dependencies
----

```
 npm install 
```



Usage
----

```
node tx.js
```



How it works
----
The script does the following:

* Logs in into Transifex using your user and password from `~/.transifexrc`
* Gets a quote for the languages that are listed in `conf.json` in the list `languagesToTranslate`
* Asks you to accept the quote
* If you accept the quote it requests the translations

The output should look like this:

![screenshot](http://i.imgur.com/2kxHRzV.png)



How to add new languages?
----

* Open `conf.json`
* `languages` is a map with all the languages that Transifex can translate to
* `languagesToTranslate` is a list of the languages that will be requested
* Add a language to the `languagesToTranslate` list. Get the name from the `languages` map



How to change the translation vendor
----

* Open `conf.json`
* Change value in `translationVendor`. Options:
    * `gengo`
    * `textmaster`



How to change the quality level
----

* Open `conf.json`
* Change value in `proQuality`. Options:
    * Pro quality: `true` 
    * Standard quality: `false`