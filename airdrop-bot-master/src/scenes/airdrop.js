const WizardScene = require('telegraf/scenes/wizard')
const { Composer } = require('telegraf')
const { Keyboard } = require('telegram-keyboard')
const dedent = require('dedent')
const createCaptcha = require('nodejs-captcha')
const Web3 = require('web3')

const isMemberOfGroup = require('../utils/isMemberOfGroup')
const getAllMembers = require('../utils/getAllMembers')

const scene = new WizardScene('airdrop',
    async (ctx) => {
        ctx.session.captchaIsCompleted = false

        await ctx.reply(dedent`
            1️⃣ Join our Telegram groups:
    
            <b>SlimeToken (SLT)</b> 🌍: @SlimeTokeneng
            <b>SlimeToken</b> 🇷🇺: @SlimeTokenrus

            ❗️ Attention! Until the end of the airdrop, you cannot unsubscribe from these groups, otherwise you will not receive coins
        `, Keyboard.reply('Check', {}, { parse_mode: 'HTML' }))

        return ctx.wizard.next()
    },
    new Composer().hears('Check', async (ctx) => {
        const isMember1 = await isMemberOfGroup(ctx, '@SlimeTokenrus')
        const isMember2 = await isMemberOfGroup(ctx, '@SlimeTokeneng')
    
        if (!isMember1 || !isMember2) {
            return ctx.reply('❗️ Looks like you have not joined the groups')
        }
        
        await ctx.reply(dedent`
            2️⃣ Subscribe to our twitter <a href='https://twitter.com/Slime_Token'>@Slime_Token</a> and enter your twitter nickname to verify subscription 
        `, { parse_mode: 'HTML', disable_web_page_preview: true, ...Keyboard.remove() })

        return ctx.wizard.next()
    }),
    async (ctx) => {
        await ctx.reply('3️⃣ Please, pass the captcha')
    
        const captcha = createCaptcha()
    
        ctx.session.captchaValue = captcha.value.toLowerCase()
    
        await ctx.replyWithPhoto({ source: Buffer.from(captcha.image.replace('data:image/jpeg;base64,', ''), 'base64') })

        return ctx.wizard.next()
    },
    async (ctx) => {
        if (!ctx.message || ctx.message.text.toLowerCase() !== ctx.session.captchaValue) {
            return ctx.reply('❗️ Wrong code...')
        }

        ctx.session.captchaIsCompleted = true
        ctx.session.captchaValue = null

        await ctx.reply('Enter your SlimeToken (SLT) wallet address')

        return ctx.wizard.next()
    },
    async (ctx) => {
        const wallet = ctx.message.text
    
        if (!Web3.utils.isAddress(wallet)) {
            return ctx.reply('❗️ Invalid wallet...')
        }

        const members = await getAllMembers()

        if (members.wallets.length >= 1000) {
            await ctx.reply(dedent`
                Unfortunately, the airdrop has already ended 😔

                Subscribe to our news channel @enrg8news, so you don't miss out on airdrops in the future
            `)

            return ctx.scene.enter('menu')
        }

        if (members.wallets.includes(wallet)) {
            return ctx.reply('❗️ This wallet has already been registered')
        }

        ctx.session.wallet = wallet

        ctx.session.tokens += 250000000

        await ctx.reply(dedent`
            Thank you ${ctx.from.first_name || ctx.from.username}!

            You registered successfully and you've received <b>250 000 000 SlimeToken (SLT)</b> for completing airdrop tasks.
            
            Also you can share your referral link and get <b>50 000 000 SLT</b> for each referral
            Your referral link: https://t.me/slime_airdrop_bot?start=${ctx.from.id}

            <b>The airdrop will end on June 10, after which you will receive coins to your wallet</b>

            <i>DM to the @Ballet228 if you entered the wrong SlimeToken (SLT) wallet</i>
        `, Keyboard.make('Menu').reply({ parse_mode: 'HTML', disable_web_page_preview: true }))
    },
    ctx => ctx.scene.enter('menu'),
)

scene.use((ctx, next) => {
    if (ctx.session.wallet) {
        return ctx.scene.enter('menu')
    }

    return next()
})

scene.command('/reset', ctx => ctx.scene.enter('menu'))

module.exports = scene
