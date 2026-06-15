const express = require("express");

const WalletTransaction = require("../models/WalletTransaction");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use("/wallet", requireAuth);

const getWalletSummary = async (userId) => {
  const transactions = await WalletTransaction.find({ user: userId }).sort({ createdAt: -1 });
  const balance = transactions.reduce((total, transaction) => {
    const sign = ["credit", "refund", "cashback"].includes(transaction.type) ? 1 : -1;
    return total + sign * transaction.amount;
  }, 0);

  return { balance, transactions };
};

router.get("/wallet", async (req, res) => {
  res.json(await getWalletSummary(req.user.id));
});

router.post("/wallet/add-money", async (req, res) => {
  const amount = Number(req.body.amount);

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Enter a valid amount" });
  }

  await WalletTransaction.create({
    user: req.user.id,
    type: "credit",
    amount,
    note: "Added money to TixWallet",
  });

  res.status(201).json(await getWalletSummary(req.user.id));
});

module.exports = router;
