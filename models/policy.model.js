const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["privacy", "terms", "contact"],
      required: true,
      unique: true,
    },

    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value) {
          if (this.type === "contact") {
            return typeof value === "object" && !Array.isArray(value);
          }
          return typeof value === "string";
        },
        message: "Contact content must be an object, others must be string",
      },
    },
  },
  { timestamps: true }
);

const Policy = mongoose.model("Policy", PolicySchema);

module.exports = Policy;
