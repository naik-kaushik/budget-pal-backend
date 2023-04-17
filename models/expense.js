const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  title: String,
  category: String,
  value: Number,
  createdAt: String,
  username: String,
});

module.exports = mongoose.model("Expense", expenseSchema);
