"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRANGER_ADDRESS = exports.SELLER_PAYMENT_ADDRESS = exports.BUYER_ORDINALS_ADDRESS = exports.BUYER_PAYMENT_ADDRESS = void 0;
exports.fundingTxid = fundingTxid;
exports.buildBuyOfferPsbt = buildBuyOfferPsbt;
const base_1 = require("@scure/base");
const btc = require("@scure/btc-signer");
const secp256k1_1 = require("@noble/curves/secp256k1");
const BUYER_PAYMENT_KEY = base_1.hex.decode('01'.repeat(32));
const BUYER_ORDINALS_KEY = base_1.hex.decode('02'.repeat(32));
const SELLER_PAYMENT_KEY = base_1.hex.decode('03'.repeat(32));
const SELLER_ORDINALS_KEY = base_1.hex.decode('04'.repeat(32));
const buyerPayment = btc.p2wpkh(secp256k1_1.secp256k1.getPublicKey(BUYER_PAYMENT_KEY, true), btc.NETWORK);
const buyerOrdinals = btc.p2tr(secp256k1_1.schnorr.getPublicKey(BUYER_ORDINALS_KEY), undefined, btc.NETWORK);
const sellerPayment = btc.p2wpkh(secp256k1_1.secp256k1.getPublicKey(SELLER_PAYMENT_KEY, true), btc.NETWORK);
const sellerOrdinals = btc.p2tr(secp256k1_1.schnorr.getPublicKey(SELLER_ORDINALS_KEY), undefined, btc.NETWORK);
exports.BUYER_PAYMENT_ADDRESS = buyerPayment.address;
exports.BUYER_ORDINALS_ADDRESS = buyerOrdinals.address;
exports.SELLER_PAYMENT_ADDRESS = sellerPayment.address;
exports.STRANGER_ADDRESS = btc.p2wpkh(secp256k1_1.secp256k1.getPublicKey(base_1.hex.decode('05'.repeat(32)), true), btc.NETWORK).address;
function fundingTxid(n) {
    return n.toString(16).padStart(2, '0').repeat(32);
}
function buildBuyOfferPsbt(opts) {
    const priceSats = opts.priceSats ?? 21_000;
    const buyerFunding = opts.buyerFunding ?? [{ txid: fundingTxid(0xaa), vout: 1, value: 100_000 }];
    const sighash = opts.buyerSighash ?? btc.SigHash.ALL;
    const outputs = opts.outputs ?? [
        { address: exports.BUYER_ORDINALS_ADDRESS, amount: opts.sellerUtxo.value },
        { address: exports.SELLER_PAYMENT_ADDRESS, amount: priceSats + opts.sellerUtxo.value },
        { address: exports.BUYER_PAYMENT_ADDRESS, amount: 10_000 },
    ];
    const tx = new btc.Transaction({ lockTime: 21, allowUnknownOutputs: true });
    tx.addInput({
        txid: opts.sellerUtxo.txid,
        index: opts.sellerUtxo.vout,
        witnessUtxo: { script: sellerOrdinals.script, amount: BigInt(opts.sellerUtxo.value) },
        tapInternalKey: secp256k1_1.schnorr.getPublicKey(SELLER_ORDINALS_KEY),
        sighashType: btc.SigHash.ALL,
    });
    for (const coin of buyerFunding) {
        tx.addInput({
            txid: coin.txid,
            index: coin.vout,
            witnessUtxo: { script: buyerPayment.script, amount: BigInt(coin.value) },
            sighashType: sighash,
        });
    }
    for (const out of outputs) {
        tx.addOutput({ script: btc.OutScript.encode(btc.Address(btc.NETWORK).decode(out.address)), amount: BigInt(out.amount) });
    }
    for (let i = 1; i <= buyerFunding.length; i++) {
        tx.signIdx(BUYER_PAYMENT_KEY, i, [sighash]);
    }
    const bytes = tx.toPSBT();
    return { base64: base_1.base64.encode(bytes), bytes };
}
//# sourceMappingURL=buy-offer-psbt.test-helper.js.map