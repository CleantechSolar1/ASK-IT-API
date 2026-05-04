const express = require("express");
const router = express.Router();

const { getCategories } = require("../controllers/issueCategory.js");

router.get("/", getCategories);

module.exports = router;
