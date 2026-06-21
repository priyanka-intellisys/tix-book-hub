import React, { useEffect, useMemo, useState } from "react";
import { FaWallet } from "react-icons/fa";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function TixWallet() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  const loadWallet = () => {
    fetch(`${apiBase}/wallet`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setWallet(data.transactions ? data : { balance: 0, transactions: [] }))
      .catch(() => setWallet({ balance: 0, transactions: [] }));
  };

  useEffect(loadWallet, [authHeaders]);

  const addMoney = async () => {
    const amount = Number(prompt("Enter amount to add"));
    if (!amount || amount <= 0) return;

    const response = await fetch(`${apiBase}/wallet/add-money`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ amount }),
    });

    if (response.ok) setWallet(await response.json());
  };

  return (
    <div className="wallet-page">
      <h1 className="wallet-heading">TixWallet</h1>
      <div className="wallet-section">
        <div className="wallet-card"><div><p>TixWallet Balance</p><h2>Rs {wallet.balance}</h2></div><FaWallet className="wallet-icon" /></div>
        <button className="wallet-card wallet-action" onClick={addMoney}>Add Money</button>
      </div>
      <div className="wallet-transactions">
        {wallet.transactions.map((item) => (
          <div className="transaction-card" key={item._id}><div><h4>{item.note}</h4><p>{item.type}</p></div><span className={["credit", "refund", "cashback"].includes(item.type) ? "green" : "red"}>Rs {item.amount}</span></div>
        ))}
      </div>
    </div>
  );
}

export default TixWallet;
