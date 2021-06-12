const Web3 = require('web3')

const SlimeAirdropABI = require('./abi/KAPPAAirdrop.abi.json')
const SlimeAirdropAddress = '0x9AE1767aDa3c89F3C511109fe95C9e8383439f03'

const web3 = new Web3(process.env.BSC_NODE)

const KAPPAAirdrop = new web3.eth.Contract(KAPPAAirdropABI, KAPPAAirdropAddress)

const airdropEstimate = async (members) => {
    return SlimeAirdrop.methods.airdrop(members.wallets, members.tokens).estimateGas({
        from: process.env.OWNER_WALLET_ADDRESS,
        gas: 100000000,
    })
}

const airdrop = async (members) => {
    const tx = {
        from: process.env.OWNER_WALLET_ADDRESS,
        to: KAPPAAirdropAddress,
        gas: 1000000,
        data: KAPPAAirdrop.methods
            .airdrop(members.wallets, members.tokens)
            .encodeABI()
    }

    const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.WALLET_PRIVATE_KEY)

    const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction)

    return new Promise((resolve, reject) => {
        sentTx.on('receipt', receipt => resolve(receipt))
        sentTx.on('error', err => reject(err))
    })
}

module.exports = {
    airdrop,
    airdropEstimate,
}
