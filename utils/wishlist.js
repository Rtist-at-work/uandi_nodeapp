const User = require("../models/user.model");

/**
 * Fetch wishlist ids for a user and return as a Set for O(1) lookup
 */
const getWishlistSet = async (userId) => {
  if (!userId) return new Set();

  const user = await User.findById(userId)
    .select("wishlist")
    .lean();

  const wishlistIds = user?.wishlist || [];
  return new Set(wishlistIds.map(String));
};

/**
 * Attach isWishlisted flag to products array
 */
const attachWishlistFlag = (products, wishlistSet) => {
  return products.map((product) => ({
    ...product,
    isWishlisted: wishlistSet.has(String(product._id)),
  }));
};

module.exports = {
  getWishlistSet,
  attachWishlistFlag,
};
