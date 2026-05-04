const { getCategoriesService } = require("../services/issueCategory.js");
const {
  successResponse,
  errorResponse,
} = require("../middlewares/responseHandler.js");

const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesService();

    return successResponse(res, categories);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  getCategories,
};
