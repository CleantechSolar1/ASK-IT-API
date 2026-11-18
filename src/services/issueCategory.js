const Category = require("../models/issueCategory.js");

const normalizeCategoryName = (name) =>
  name?.trim().toLowerCase() === "business central"
    ? "Business Central - ERP"
    : name;

const getCategoriesService = async () => {
  const categories = await Category.find().lean();
  const normalizedCategories = [];
  const categoryNames = new Set();

  for (const category of categories) {
    const normalizedCategory = {
      ...category,
      name: normalizeCategoryName(category.name),
    };
    const normalizedName = normalizedCategory.name?.trim().toLowerCase();

    if (!normalizedName || categoryNames.has(normalizedName)) continue;

    categoryNames.add(normalizedName);
    normalizedCategories.push(normalizedCategory);
  }

  if (!categoryNames.has("sim card")) {
    normalizedCategories.push({ _id: "sim-card", name: "Sim Card" });
  }

  return normalizedCategories;
};

module.exports = {
  getCategoriesService,
  normalizeCategoryName,
};
