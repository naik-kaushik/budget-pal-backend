const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  idealBudget: {
    transportation: Number,
    groceries: Number,
    food: Number,
    utilitybills: Number,
    rent: Number,
    miscellaneous: Number,
  },
  actualBudget: {
    transportation: Number,
    groceries: Number,
    food: Number,
    utilitybills: Number,
    rent: Number,
    miscellaneous: Number,
  },
  favStocks: [
    {
      name: String,
      stockName: String,
    },
  ],
});

module.exports = mongoose.model("userDetail", userDetailsSchema);
