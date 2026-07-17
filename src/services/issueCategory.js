const Category = require("../models/issueCategory.js");

const getCategoriesService = async () => {
  const categories = await Category.find().lean();

  if (!categories.some((category) => category.name === "Sim Card")) {
    categories.push({ _id: "sim-card", name: "Sim Card" });
  }

  return categories;
};

module.exports = {
  getCategoriesService,
};
