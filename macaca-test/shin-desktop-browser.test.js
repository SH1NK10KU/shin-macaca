'use strict';

require('should');
const fs = require('fs');
const opn = require('opn');
const path = require('path');
const wd = require('macaca-wd');

require('./wd-extend')(wd, false);

const diffImage = require('./utils.js').diffImage;

var browser = process.env.browser || 'electron' || 'puppeteer';
browser = browser.toLowerCase();

const browserOpts = {
    host: "localhost",
    timeout: 300000,
    waitFor: {
        timeout: 10000,
        interval: 100
    },
    sleep: {
        default: 3000
    },
    window: {
        width: 1024,
        height: 768
    },
    http: {
        userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0 Safari/537.36 Macaca Custom UserAgent"
    }

};

const logInPage = {
    url: 'https://www.strikingly.com/s/login',
    emailTextField: {
        id: 'user_email'
    },
    passwordTextField: {
        id: 'user_password'
    },
    logInButton: {
        className: 's-btn'
    }
};

const dashboardPage = {
    editButton: {
        selector: '.edit',
        className: 'edit'
    },
};

const tutorialPage = {
    popupDialog: {
        title: {
            xpath: '//div[contains(@class, "panel") and contains(@class, "active")]/div[@class="text"]/h3'
        },
        content: {
            selector: '.panel.active > .text',
            xpath: '//div[contains(@class, "panel") and contains(@class, "active")]/div[@class="text"]'
        },
        getDialogXPathByTitle: function(title) {
            return '//div[contains(@class, "panel") and contains(@class, "active")]/div[@class="text"]/h3[contains(text(),"' + title + '")]';
        },
        getButtonXPathByText: function(text) {
            return '//div[contains(@class, "panel") and contains(@class, "active")]/div[@class="next"]/a[contains(text(),"' + text + '")]';
        }
    },
    menu: {
        sections: {
            contactUsButton: {
                xpath: '//div[contains(@class,"section-button") and contains(text(), "Contact Us")]'
            }
        },
        editFonts: {
            titleFont: {
                getFontXPathByName: function(name) {
                    return '//div[@class="font-item-inner" and contains(text(), "' + name + '")]';
                }
            }
        }
    },
    page: {
        contactWithUsTextBox: {
            xpath: '//div[@role="textbox"]/p[contains(text(), "Connect With Us")]'
        }
    },
    toolbar: {
        changeFontFamilyButton: {
            id: 'cke_599'
        }
    }
};

const user = {
    email: '{YOUR_EMAIL}',
    password: '{YOUR_PASSWORD}'
};

wd.addPromiseChainMethod('logInWithEmailAndPassword', function (email, password) {
    return this.waitForElementById(logInPage.emailTextField.id, browserOpts.waitFor.timeout, browserOpts.waitFor.interval)
        .sendKeys(email)
        .elementById(logInPage.passwordTextField.id)
        .sendKeys(password)
        .elementByClassName(logInPage.logInButton.className)
        .click()
        .sleep(browserOpts.sleep.default);
});

wd.addPromiseChainMethod('getElementInnerTextByCssSelector', function (cssSelector) {
    return this.execute(`
        var element = document.querySelector('${cssSelector}');
        return element.innerText;  
    `);
});

wd.addPromiseChainMethod('getElementInArrayByCssSelectorAndIndex', function (cssSelector, index) {
    return this.execute(`
        var element = document.querySelectorAll('${cssSelector}')[${index}];
        return element;  
    `);
});

wd.addPromiseChainMethod('clickElementByIndex', function (cssSelector, index) {
    return this.waitForElementByCssSelector(dashboardPage.editButton.selector, browserOpts.waitFor.timeout, browserOpts.waitFor.interval)
        .getElementInArrayByCssSelectorAndIndex(dashboardPage.editButton.selector, index)
        .click()
        .sleep(browserOpts.sleep.default);
});

wd.addPromiseChainMethod('replaceUrlAndRedirect', function (oldValue, newValue) {
    return this.execute(`
        window.location.href = window.location.href.replace('${oldValue}', '${newValue}');
    `);
});

wd.addPromiseChainMethod('checkDialogTitleAndContent', function (title, content, button) {
    return this.waitForElementByXPath(tutorialPage.popupDialog.getDialogXPathByTitle(title), browserOpts.waitFor.timeout, browserOpts.waitFor.interval)
        .getElementInnerTextByCssSelector(tutorialPage.popupDialog.content.selector)
        .then(value => {
            value.indexOf(content).should.not.eql(-1);
        })
        .elementByXPath(tutorialPage.popupDialog.getButtonXPathByText(button))
        .click()
        .sleep(browserOpts.sleep.default);
});

wd.addPromiseChainMethod('clickElementByXPath', function (xpath) {
    return this.waitForElementByXPath(xpath, browserOpts.waitFor.timeout, browserOpts.waitFor.interval)
        .click()
        .sleep(browserOpts.sleep.default);
});

wd.addPromiseChainMethod('clickElementById', function (id) {
    return this.waitForElementById(id, browserOpts.waitFor.timeout, browserOpts.waitFor.interval)
        .click()
        .sleep(browserOpts.sleep.default);
});

wd.addPromiseChainMethod('getFontFamilyByXPath', function (xpath) {
    return this.waitForElementByXPath(xpath, browserOpts.waitFor.timeout, browserOpts.waitFor.interval)
        .getComputedCss('font-family');
});

describe('Shin Feng\'s test scripts', function() {
    this.timeout(browserOpts.timeout);
    
    var driver = wd.promiseChainRemote({
        host: browserOpts.host,
        port: process.env.MACACA_SERVER_PORT || 3456
    });

    before(() => {
        return driver
            .init({
                platformName: 'desktop',
                browserName: browser,
                userAgent: browserOpts.http.userAgent,
                deviceScaleFactor: 2
            })
            .setWindowSize(browserOpts.window.width, browserOpts.window.height);
    });

    afterEach(function() {
        return driver
            .customSaveScreenshot(this)
            .sleep(browserOpts.sleep.default);
    });
    
    after(function() {
        opn(path.join(__dirname, '..', 'reports', 'index.html'));
    });
  
    describe('Sample test cases', function() {
        it('Part 1: verify these Windows are shown in correct sequence with corresponding titles and content', function() {
            const dialogSequence = [{
                    title: 'Hi, there!',
                    content: 'Welcome to the Strikingly editor. We recommend taking a super quick tour to show you the ropes.',
                    button: 'Take the tour!'
                },{
                    title: 'Site Sections',
                    content: 'Your site is broken up into SECTIONS. You can add, delete, rearrange, and jump to your sections here.',
                    button: 'Next'
                },{
                    title: 'Add Store, Blog, and more',
                    content: 'Click this button to add a new section. There\'s plenty to choose from — blog, galleries, contact forms, and even our App Store!',
                    button: 'Next'
                },{
                    title: 'Customize',
                    content: 'STYLES let you play with the look and feel of the site while SETTINGS let you configure your URL, domain name, and lots more.',
                    button: 'Next'
                },{
                    title: 'Publish to go live',
                    content: 'Remember to click PUBLISH once you\'re ready to go live! Any changes you make won\'t be visible to the world until you click this button.',
                    button: 'Next'
                },{
                    title: 'Get Help',
                    content: 'Click this icon if you get stuck! You can search our knowledge base or contact us for support.',
                    button: 'Next'
                },{
                    title: 'Site Content',
                    content: 'Now it\'s your turn. Click anything on this site to edit!',
                    button: 'Get started!'
                }
            ];
            
            return driver
                .get(logInPage.url)
                .logInWithEmailAndPassword(user.email, user.password)
                .clickElementByIndex(dashboardPage.editButton.selector, 0)
                .replaceUrlAndRedirect('/edit','/edit?open=tutorial')
                .checkDialogTitleAndContent(dialogSequence[0].title, dialogSequence[0].content, dialogSequence[0].button)
                .checkDialogTitleAndContent(dialogSequence[1].title, dialogSequence[1].content, dialogSequence[1].button)
                .checkDialogTitleAndContent(dialogSequence[2].title, dialogSequence[2].content, dialogSequence[2].button)
                .checkDialogTitleAndContent(dialogSequence[3].title, dialogSequence[3].content, dialogSequence[3].button)
                .checkDialogTitleAndContent(dialogSequence[4].title, dialogSequence[4].content, dialogSequence[4].button)
                .checkDialogTitleAndContent(dialogSequence[5].title, dialogSequence[5].content, dialogSequence[5].button)
                .checkDialogTitleAndContent(dialogSequence[6].title, dialogSequence[6].content, dialogSequence[6].button);
        });
    
        it('Part 2: verify the text font is changed to \'Arvo\'', function() {
            return driver
                .clickElementByXPath(tutorialPage.menu.sections.contactUsButton.xpath)
                .clickElementByXPath(tutorialPage.page.contactWithUsTextBox.xpath)
                .clickElementById(tutorialPage.toolbar.changeFontFamilyButton.id)
                .clickElementByXPath(tutorialPage.menu.editFonts.titleFont.getFontXPathByName('Arvo'))
                .getFontFamilyByXPath(tutorialPage.page.contactWithUsTextBox.xpath)
                .then(value => {
                    value.should.startWith('arvo');
                });
        });

        after(() => {
            return driver
                .quit();
        });
    });
});
