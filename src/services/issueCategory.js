const Category = require("../models/issueCategory.js");

const getCategoriesService = async () => {
  const categories = await Category.find();

  return categories;
};

module.exports = {
  getCategoriesService,
};
