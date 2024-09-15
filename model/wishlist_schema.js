const mongoose = require('mongoose')

const whishListSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "products",
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Wishlist", whishListSchema);