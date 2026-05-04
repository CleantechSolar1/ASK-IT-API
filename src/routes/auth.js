const express = require("express");
const router = express.Router();

const { signup, login, microsoftLogin, microsoftCallback, teamsSSO, logout, getMe } = require("../controllers/auth");
const authMiddleware = require("../middlewares/auth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/microsoft", microsoftLogin);
router.get("/microsoft/callback", microsoftCallback);
router.post("/teams-sso", teamsSSO);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

module.exports = router;
