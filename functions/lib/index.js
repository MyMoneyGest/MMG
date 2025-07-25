"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTransaction = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
exports.processTransaction = (0, firestore_1.onDocumentCreated)('transactions/{transactionId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    if (!data?.senderUid || !data?.receiverUid || !data?.amount) {
        console.error('Transaction invalide : données manquantes', data);
        return;
    }
    const { senderUid, receiverUid, amount } = data;
    const transactionRef = snap.ref;
    const senderRef = db.doc(`users/${senderUid}/linkedAccounts/airtel`);
    const receiverRef = db.doc(`users/${receiverUid}/linkedAccounts/airtel`);
    await db.runTransaction(async (t) => {
        const senderSnap = await t.get(senderRef);
        const receiverSnap = await t.get(receiverRef);
        const senderBalance = senderSnap.data()?.airtelBalance || 0;
        const receiverBalance = receiverSnap.data()?.airtelBalance || 0;
        if (senderBalance < amount) {
            await t.update(transactionRef, {
                status: 'failed',
                error: 'Solde insuffisant',
            });
            return;
        }
        t.update(senderRef, {
            airtelBalance: senderBalance - amount,
            transactions: admin.firestore.FieldValue.arrayUnion({
                type: 'virement_émis',
                to: receiverUid,
                amount,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            }),
        });
        t.update(receiverRef, {
            airtelBalance: receiverBalance + amount,
            transactions: admin.firestore.FieldValue.arrayUnion({
                type: 'virement_reçu',
                from: senderUid,
                amount,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            }),
        });
        t.update(transactionRef, { status: 'success' });
    });
});
