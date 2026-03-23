const mongoose = require("mongoose");

const AboutSchema = new mongoose.Schema(
  {
    hero: {
      badge: String,
      title: String,
      subtitle: String,
    },
    ceo: {
      heading: String,
      message: String,
      videoUrl: String,
    },
    pillars: [
      {
        title: String,
        desc: String,
      },
    ],
  },
  { timestamps: true }
);


const About = mongoose.model("About", AboutSchema);

module.exports = About;
