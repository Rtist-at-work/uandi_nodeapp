const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  banner: { type: String }, // image file id or url
  description: { type: String },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "products" }],
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 1 } // for home page ordering
}, { timestamps: true });